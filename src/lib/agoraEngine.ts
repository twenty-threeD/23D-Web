import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng'
import type { CallSession, ScreenShareSession } from './call'

// 아고라 미디어 계층. React 상태와 분리해 모듈 싱글턴으로 둔다.
//
// 트랙·클라이언트는 리렌더와 무관하게 살아 있어야 하고(스토어에 넣으면 zustand 가 직렬화·비교하다
// 참조가 깨진다), 정리(stop/close/leave)를 한 곳에서 보장해야 카메라 LED 가 확실히 꺼진다.

export type RemoteVideoKind = 'camera' | 'screen'

interface EngineHandlers {
  // 원격 영상 트랙이 붙거나(track) 떨어질 때(null). kind 로 카메라/화면공유를 구분한다.
  onRemoteVideo?: (kind: RemoteVideoKind, track: IRemoteVideoTrack | null) => void
  // 기본 1시간. 이걸 무시하면 긴 통화에서 뚝 끊긴다.
  onTokenExpiring?: () => void
  // 브라우저 자체의 "공유 중지" 버튼을 눌렀을 때
  onScreenEnded?: () => void
  onPeerLeft?: () => void
  onError?: (message: string) => void
}

// 클라이언트에서만 로드한다. SSR 중에 window 를 건드려 빌드가 깨지는 걸 막는다.
async function loadSdk() {
  const mod = await import('agora-rtc-sdk-ng')
  const sdk = mod.default
  // 콘솔이 아고라 로그로 뒤덮이면 우리 로그가 안 보인다. 경고 이상만 남긴다.
  sdk.setLogLevel(2)
  return sdk
}

type AgoraSdk = Awaited<ReturnType<typeof loadSdk>>

export interface PlaybackDevice {
  deviceId: string
  label: string
}

class CallEngine {
  private sdk: AgoraSdk | null = null
  private client: IAgoraRTCClient | null = null
  private screenClient: IAgoraRTCClient | null = null
  private micTrack: IMicrophoneAudioTrack | null = null
  private camTrack: ICameraVideoTrack | null = null
  private screenTrack: ILocalVideoTrack | null = null
  private handlers: EngineHandlers = {}
  // 원격 스트림이 카메라인지 화면인지는 uid 로만 판별할 수 있다 (아고라는 종류를 알려주지 않는다)
  private screenUids = new Set<number>()
  private myScreenUid: number | null = null
  private playbackDeviceId: string | null = null
  private remoteAudioPlaying = new Set<IAgoraRTCRemoteUser>()
  // join 은 채널 접속·마이크 획득·publish 로 이어지는 긴 비동기라, 그 사이에 사용자가
  // 끊으면 이미 정리된 클라이언트에 publish 해서 터진다.
  // leave 가 이 번호를 올려 진행 중이던 join 을 스스로 접게 만든다.
  private generation = 0

  setHandlers(handlers: EngineHandlers) {
    this.handlers = handlers
  }

  // call 스냅샷이 바뀔 때마다 갱신해준다. 양쪽의 screenUid 를 모두 담는다.
  setScreenUids(uids: number[]) {
    this.screenUids = new Set(uids.filter((u) => typeof u === 'number'))
  }

  get localCameraTrack(): ICameraVideoTrack | null {
    return this.camTrack
  }

  get localScreenTrack(): ILocalVideoTrack | null {
    return this.screenTrack
  }

  private async ensureSdk() {
    if (!this.sdk) this.sdk = await loadSdk()
    return this.sdk
  }

  private kindOf(uid: number | string): RemoteVideoKind {
    return this.screenUids.has(Number(uid)) ? 'screen' : 'camera'
  }

  async join(session: CallSession, opts: { video: boolean }) {
    const sdk = await this.ensureSdk()
    if (this.client) await this.leave()

    // leave() 가 generation 을 올리므로 그 뒤에 내 번호를 받아야 한다
    const gen = ++this.generation

    const client = sdk.createClient({ mode: 'rtc', codec: 'vp8' })
    this.client = client

    client.on('user-published', async (user, mediaType) => {
      // 내 화면공유는 같은 채널에 별도 uid 로 들어와 있어서 나한테도 되돌아온다. 구독하면 에코가 난다.
      if (this.myScreenUid !== null && Number(user.uid) === this.myScreenUid) return
      try {
        await client.subscribe(user, mediaType)
      } catch {
        return
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play()
        this.remoteAudioPlaying.add(user)
        void this.applyPlaybackDevice(user)
      } else {
        this.handlers.onRemoteVideo?.(this.kindOf(user.uid), user.videoTrack ?? null)
      }
    })

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') this.handlers.onRemoteVideo?.(this.kindOf(user.uid), null)
      else this.remoteAudioPlaying.delete(user)
    })

    client.on('user-left', (user) => {
      this.handlers.onRemoteVideo?.(this.kindOf(user.uid), null)
      this.remoteAudioPlaying.delete(user)
      // 화면공유는 별도 uid 로 들어와 있어서, 공유를 끄면 그 uid 가 채널을 떠난다.
      // 이걸 사람이 나간 것으로 보면 상대가 공유만 껐는데 통화가 끊긴다.
      if (this.kindOf(user.uid) === 'camera') this.handlers.onPeerLeft?.()
    })

    client.on('token-privilege-will-expire', () => this.handlers.onTokenExpiring?.())

    await client.join(session.appId, session.channelName, session.rtcToken, session.uid)
    if (gen !== this.generation) return this.discard(client)

    // 마이크는 항상 먼저 잡는다. 음성으로 시작해도 나중에 카메라만 얹으면 되도록.
    const mic = await sdk.createMicrophoneAudioTrack()
    if (gen !== this.generation) return this.discard(client, mic)
    this.micTrack = mic

    await client.publish(mic)
    if (gen !== this.generation) return this.discard(client, mic)

    if (opts.video) await this.setCamera(true)
  }

  // 접속 도중에 통화가 끝난 경우. 여기까지 만든 것만 조용히 되돌린다.
  private async discard(client: IAgoraRTCClient, ...tracks: (IMicrophoneAudioTrack | null)[]) {
    for (const track of tracks) {
      if (!track) continue
      track.stop()
      track.close()
    }
    if (this.micTrack && tracks.includes(this.micTrack)) this.micTrack = null
    try {
      await client.leave()
    } catch {
      // 아직 붙지도 못한 상태일 수 있다
    }
    client.removeAllListeners()
    if (this.client === client) this.client = null
  }

  async renewToken(rtcToken: string) {
    await this.client?.renewToken(rtcToken)
  }

  async setMic(on: boolean) {
    // 트랙을 unpublish 하지 않고 enabled 만 바꾼다. 껐다 켤 때마다 재협상하면 소리가 끊긴다.
    await this.micTrack?.setEnabled(on)
  }

  async setCamera(on: boolean) {
    const sdk = await this.ensureSdk()
    if (!this.client) return

    if (on) {
      if (!this.camTrack) {
        this.camTrack = await sdk.createCameraVideoTrack()
        await this.client.publish(this.camTrack)
      } else {
        await this.camTrack.setEnabled(true)
      }
      return
    }

    if (this.camTrack) {
      // 카메라는 끌 때 트랙을 완전히 닫는다. setEnabled(false) 만으로는 기기 LED 가 안 꺼진다.
      await this.client.unpublish(this.camTrack)
      this.camTrack.stop()
      this.camTrack.close()
      this.camTrack = null
    }
  }

  // 아고라는 화면공유를 "같은 채널에 별도 uid 로 한 번 더 접속"시키는 방식이라
  // 클라이언트 인스턴스를 하나 더 만들어야 한다.
  async startScreen(session: ScreenShareSession) {
    const sdk = await this.ensureSdk()
    if (this.screenClient) await this.stopScreen()

    // 트랙을 먼저 만든다. 사용자가 공유 선택창에서 취소하면 여기서 예외가 나는데,
    // 그 전에 채널에 붙어버리면 빈 화면공유 참가자가 남는다.
    const track = (await sdk.createScreenVideoTrack({}, 'disable')) as ILocalVideoTrack
    this.screenTrack = track
    track.on('track-ended', () => this.handlers.onScreenEnded?.())

    const screenClient = sdk.createClient({ mode: 'rtc', codec: 'vp8' })
    this.screenClient = screenClient
    this.myScreenUid = session.screenUid

    await screenClient.join(session.appId, session.channelName, session.rtcToken, session.screenUid)
    await screenClient.publish(track)
  }

  async stopScreen() {
    if (this.screenTrack) {
      this.screenTrack.stop()
      this.screenTrack.close()
      this.screenTrack = null
    }
    if (this.screenClient) {
      try {
        await this.screenClient.leave()
      } catch {
        // 이미 끊긴 경우. 아래에서 참조만 비워주면 된다.
      }
      this.screenClient.removeAllListeners()
      this.screenClient = null
    }
    this.myScreenUid = null
  }

  // 스피커폰/블루투스 전환. 크롬 계열 데스크톱에서만 동작하는 API 라 빈 배열이 나올 수 있다.
  async listPlaybackDevices(): Promise<PlaybackDevice[]> {
    try {
      const sdk = await this.ensureSdk()
      const devices = await sdk.getPlaybackDevices()
      return devices
        .filter((d) => d.deviceId)
        .map((d) => ({ deviceId: d.deviceId, label: d.label || '오디오 출력' }))
    } catch {
      return []
    }
  }

  async setPlaybackDevice(deviceId: string) {
    this.playbackDeviceId = deviceId
    await Promise.all([...this.remoteAudioPlaying].map((user) => this.applyPlaybackDevice(user)))
  }

  private async applyPlaybackDevice(user: IAgoraRTCRemoteUser) {
    if (!this.playbackDeviceId) return
    try {
      await user.audioTrack?.setPlaybackDevice(this.playbackDeviceId)
    } catch {
      // setSinkId 미지원 브라우저(사파리·모바일)에서는 조용히 기본 출력을 쓴다
    }
  }

  // 종료 시 track.stop() + close() + leave() 를 빠짐없이 한다. 안 하면 카메라 LED 가 안 꺼진다.
  async leave() {
    // 진행 중인 join 이 있으면 여기서 무효가 된다
    this.generation++
    await this.stopScreen()

    for (const track of [this.micTrack, this.camTrack]) {
      if (!track) continue
      track.stop()
      track.close()
    }
    this.micTrack = null
    this.camTrack = null

    if (this.client) {
      try {
        await this.client.leave()
      } catch {
        // 이미 끊겼거나 join 전에 취소된 경우
      }
      this.client.removeAllListeners()
      this.client = null
    }

    this.remoteAudioPlaying.clear()
    this.screenUids.clear()
  }
}

export const callEngine = new CallEngine()
