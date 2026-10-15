import { create } from 'zustand'
import type { IRemoteVideoTrack } from 'agora-rtc-sdk-ng'
import {
  callEngine,
  ensureMediaPermission,
  MediaPermissionError,
  toPermissionError,
  type CameraFacing,
  type PlaybackDevice,
  type RemoteVideoKind,
} from '@/src/lib/agoraEngine'
import {
  acceptCall,
  endCall,
  getActiveCall,
  getCall,
  participantsOf,
  isCallOver,
  renewCallToken,
  getRoomCalls,
  startCall,
  startScreenShare,
  stopScreenShare,
  updateCallMedia,
  type Call,
  type CallSession,
  type CallSignalEvent,
  type CallType,
} from '@/src/lib/call'
import { ApiError } from '@/src/lib/apiError'

// 서버에서 받은 접속 정보로 채널에 붙는다. 발신·수락·재접속이 같은 순서를 밟아야 해서 한 곳에 둔다.
// 붙는 데 몇 초가 걸려 그 사이 통화가 정리될 수 있다(상대 거절·내 종료). 그때는 채널에서 다시 나오고 false 를 돌려준다
async function joinChannel(session: CallSession, video: boolean, stillConnecting: () => boolean) {
  callEngine.setScreenUids([session.call.caller.screenUid, session.call.callee.screenUid])
  await callEngine.join(session, { video })
  // 영상으로 시작하면 toggleCam 을 거치지 않고 카메라가 켜지므로 전·후면 전환 가능 여부를 여기서도 확인한다
  if (video) void callEngine.hasMultipleCameras().then((canFlipCamera) => useCallStore.setState({ canFlipCamera }))
  if (stillConnecting()) return true
  await callEngine.leave()
  return false
}

// outgoing  = 내가 걸고 상대 응답을 기다리는 중
// incoming  = 상대가 걸어와 벨이 울리는 중
// connecting= 수락/발신 직후 채널에 붙는 중
// active    = 통화 중
export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active'

interface CallStore {
  phase: CallPhase
  call: Call | null
  session: CallSession | null
  myUsername: string | null
  // 통화 API 응답이 오기 전(발신 버튼을 누른 직후)에도 상대를 보여줘야 해서,
  // 이름·프로필 이미지는 통화를 거는 화면(채팅방)에서 미리 넘겨받는다.
  // 이미지는 응답에 아예 없어서 통화 내내 이 값을 쓴다.
  peerNameHint: string | null
  peerImageUrl: string | null

  micOn: boolean
  camOn: boolean
  screenOn: boolean
  // 버튼 연타로 join/publish 가 겹치는 걸 막는다
  busy: boolean

  remoteCamTrack: IRemoteVideoTrack | null
  remoteScreenTrack: IRemoteVideoTrack | null

  devices: PlaybackDevice[]
  deviceId: string | null

  activeSince: number | null
  error: string | null
  // 통화가 왜 끝났는지 알리는 한 줄 (거절·부재중·상대 종료). 화면이 조용히 닫히면 무슨 일인지 알 수 없다.
  notice: string | null
  // 전체화면 여부. 통화는 우하단 도크에서 시작하고, 영상이 붙으면 그때 넓힌다.
  // 벨이 울리는 것만으로 화면을 덮으면 하던 일을 가린다.
  expanded: boolean
  // 상대가 채널에서 빠져 다시 들어오길 기다리는 중. 그동안 통화 시간 대신 대기 문구를 보여준다
  peerReconnecting: boolean
  // 내 카메라가 앞(user)·뒤(environment) 중 어디를 보는지. 앞일 때만 내 화면을 거울처럼 뒤집어 보여준다
  cameraFacing: CameraFacing
  // 전·후면을 고를 수 있는 기기인지. 카메라를 켤 때 한 번 확인한다
  canFlipCamera: boolean

  setMyUsername: (username: string | null) => void
  applySignal: (event: CallSignalEvent) => void
  setRemoteVideo: (kind: RemoteVideoKind, track: IRemoteVideoTrack | null) => void
  setError: (message: string | null) => void
  setNotice: (message: string | null) => void
  setExpanded: (expanded: boolean) => void

  start: (
    token: string,
    roomId: number,
    callType: CallType,
    peer?: { name?: string | null; imageUrl?: string | null }
  ) => Promise<void>
  accept: (token: string) => Promise<void>
  // 새로고침·재진입 직후 서버에 남아 있는 내 통화를 되살린다
  resume: (token: string) => Promise<void>
  // 토큰은 기다리는 15초 사이에 갱신될 수 있어 값이 아니라 최신 값을 꺼내는 함수로 받는다
  handlePeerLeft: (getToken: () => string | null) => void
  handlePeerJoined: () => void
  hangUp: (token: string) => Promise<void>
  toggleMic: (token: string) => Promise<void>
  toggleCam: (token: string) => Promise<void>
  flipCamera: () => Promise<void>
  toggleScreen: (token: string) => Promise<void>
  refreshDevices: () => Promise<void>
  selectDevice: (deviceId: string) => Promise<void>
  renew: (token: string) => Promise<void>
  reset: () => Promise<void>
}

const initial = {
  phase: 'idle' as CallPhase,
  call: null,
  session: null,
  peerNameHint: null,
  peerImageUrl: null,
  micOn: true,
  camOn: false,
  screenOn: false,
  busy: false,
  remoteCamTrack: null,
  remoteScreenTrack: null,
  devices: [] as PlaybackDevice[],
  deviceId: null,
  activeSince: null,
  error: null,
  notice: null,
  expanded: false,
  peerReconnecting: false,
  cameraFacing: 'user' as CameraFacing,
  canFlipCamera: false,
}

// 상대가 종료 버튼으로 끊으면 서버가 ENDED 신호를 보내 즉시 끝난다. 그 신호 없이 채널에서만 빠졌다면
// 새로고침이나 일시적인 네트워크 끊김일 수 있어, 다시 들어올 시간을 주고 그래도 없을 때만 끊는다
const PEER_RECONNECT_TIMEOUT_MS = 15_000
const TOKEN_RENEW_ATTEMPTS = 3
const TOKEN_RENEW_RETRY_MS = 5_000
let peerLeftTimer: ReturnType<typeof setTimeout> | null = null

function clearPeerLeftTimer() {
  if (peerLeftTimer) clearTimeout(peerLeftTimer)
  peerLeftTimer = null
}

// 통화가 끝났을 때 띄울 안내. 내가 한 행동(내가 끊기·거절)에는 아무것도 띄우지 않는다.
function noticeFor(call: Call, iAmCaller: boolean, byMe: boolean): string | null {
  if (byMe) return null
  switch (call.status) {
    case 'REJECTED':
      return '상대방이 통화를 거절했어요.'
    case 'CANCELED':
      return '상대방이 통화를 취소했어요.'
    case 'MISSED':
      return iAmCaller ? '상대방이 받지 않았어요.' : '부재중 전화가 있어요.'
    case 'ENDED':
      return '통화가 종료되었어요.'
    default:
      return null
  }
}

function messageOf(e: unknown): string {
  if (e instanceof MediaPermissionError) return e.message
  if (e instanceof ApiError) {
    // UI 안내가 필요한 두 가지. 서버 문구가 영문이라 여기서 바꿔 보여준다.
    if (e.code === 'CALL_ALREADY_IN_PROGRESS') return '이미 진행 중인 통화가 있어요.'
    if (e.code === 'SCREEN_SHARE_OCCUPIED') return '상대방이 화면을 공유하고 있어요.'
    // 서버 예외는 사용자가 할 수 있는 게 없지만, 백엔드와 맞춰보는 동안에는
    // 상태 코드가 화면에 보여야 어디를 봐야 할지 바로 알 수 있다.
    if (e.status >= 500) return `서버 오류로 통화를 시작하지 못했어요. (${e.status}${e.code ? ` ${e.code}` : ''})`
    return e.message
  }
  // 아고라 SDK 가 던진 권한·기기 예외도 같은 안내로 바꾼다
  return toPermissionError(e, true)?.message ?? '통화를 연결하지 못했어요.'
}

// 연결 도중 실패했을 때 서버에 만들어진 통화를 반드시 접는다.
// 이걸 빼먹으면 상대 전화가 계속 울리고, 다음 통화가 "이미 진행 중"으로 막힌다.
async function abandonCall(token: string, callId: number | undefined) {
  if (callId == null) return
  await endCall(token, callId).catch(() => {})
}

// 방에 살아 있는 통화를 전부 끊는다. 끊긴 게 하나라도 있으면 true.
async function clearStaleCalls(token: string, roomId: number): Promise<boolean> {
  try {
    const calls = await getRoomCalls(token, roomId)
    const alive = calls.filter((c) => !isCallOver(c.status))
    if (alive.length === 0) return false
    await Promise.all(alive.map((c) => endCall(token, c.callId).catch(() => {})))
    return true
  } catch {
    return false
  }
}

export const useCallStore = create<CallStore>()((set, get) => ({
  ...initial,
  myUsername: null,

  setMyUsername: (myUsername) => set({ myUsername }),
  setError: (error) => set({ error }),
  setNotice: (notice) => set({ notice }),
  setExpanded: (expanded) => set({ expanded }),

  setRemoteVideo: (kind, track) =>
    set(
      kind === 'screen'
        ? { remoteScreenTrack: track, expanded: track ? true : get().expanded }
        : { remoteCamTrack: track, expanded: track ? true : get().expanded }
    ),

  // 서버가 주는 call 은 항상 최신 전체 스냅샷이라 그대로 덮어쓴다.
  applySignal: ({ signal, call, fromUsername }) => {
    const state = get()
    callEngine.setScreenUids([call.caller.screenUid, call.callee.screenUid])

    if (isCallOver(call.status)) {
      // 내가 끊은 경우엔 hangUp 이 이미 화면을 닫아둔 뒤라 되울림을 무시한다
      if (state.phase === 'idle') return
      // 다른 통화가 끝났다는 신호가 늦게 도착해 지금 통화를 닫아버리는 걸 막는다
      if (state.call && state.call.callId !== call.callId) return

      const iAmCaller = call.caller.username === state.myUsername
      set({ notice: noticeFor(call, iAmCaller, fromUsername === state.myUsername) })
      // reset 이 notice 는 남겨두므로 화면을 닫고 나서 안내만 뜬다
      void get().reset()
      return
    }

    if (signal === 'INVITED') {
      // 통화 중에 걸려온 건 서버가 어차피 409 로 막으므로 화면만 조용히 무시한다
      if (state.phase !== 'idle') return
      // 받는 쪽은 하던 일이 있다. 도크나 채팅방 카드로만 알리고 화면은 건드리지 않는다.
      set({
        phase: 'incoming',
        call,
        // 통화 응답에 참여자 사진이 들어와서 채팅방 목록을 뒤지지 않는다. 목록을 아직 안 받았을 때도 사진이 나온다
        peerImageUrl: call.caller.imageUrl ?? null,
        micOn: true,
        camOn: call.callType === 'VIDEO',
        expanded: false,
      })
      return
    }

    // INVITED 가 아닌데 통화 중이 아니면 남의 통화이거나 뒤늦게 온 신호다.
    // (연결 중 phase 는 idle 이 아니므로 여기서 걸러지지 않는다 — 그 사이 온 ACCEPTED 를 살려야 한다)
    if (state.phase === 'idle') return

    set({ call })

    // 발신자는 이 신호를 받는 순간 연결됨 화면으로 넘어간다 (이미 채널에는 붙어 있다)
    if (signal === 'ACCEPTED' && state.phase === 'outgoing') {
      // 통화가 붙으면 양쪽 다 전체화면으로 들어간다.
      // 작게 쓰고 싶으면 축소 버튼으로 내리면 되고, 그 선택은 사용자가 한다.
      set({ phase: 'active', activeSince: Date.now(), expanded: true })
    }
  },

  start: async (token, roomId, callType, peer) => {
    if (get().phase !== 'idle') return
    set({
      ...initial,
      devices: get().devices,
      deviceId: get().deviceId,
      phase: 'connecting',
      peerNameHint: peer?.name ?? null,
      peerImageUrl: peer?.imageUrl ?? null,
      camOn: callType === 'VIDEO',
      // 건 사람은 상대가 받을 때까지 전체화면에서 기다린다.
      // 받는 쪽과 달리 지금 하려는 일이 통화뿐이라 화면을 덮어도 방해되지 않는다.
      expanded: true,
    })
    try {
      // 서버에 통화를 만들기 전에 권한부터 확인한다.
      // 거부당한 뒤에 만들면 상대 전화만 울리는 유령 통화가 남는다.
      await ensureMediaPermission(callType === 'VIDEO')
      const session = await startCall(token, roomId, callType)
      // 권한 확인·startCall 응답을 기다리는 사이 끊었으면 hangUp 은 callId 를 몰라 서버에 종료를 못 보냈다.
      // 여기서 접지 않으면 상대 전화가 계속 울리고 다음 통화가 409 로 막힌다
      if (get().phase !== 'connecting') {
        await abandonCall(token, session.call.callId)
        return
      }
      // 채널에 붙기 전에 먼저 들고 있는다.
      // 이게 없으면 접속하는 몇 초 사이에 끊었을 때 callId 를 몰라 서버에 종료를 못 알리고,
      // 화면만 닫힌 채 상대 전화는 계속 울린다.
      // 건 쪽은 채팅방에서 넘겨준 사진을 먼저 띄우고, 서버가 준 상대 사진이 있으면 그걸로 맞춘다
      set({
        call: session.call,
        session,
        peerImageUrl: session.call.callee.imageUrl ?? get().peerImageUrl,
      })
      const joined = await joinChannel(session, callType === 'VIDEO', () => get().phase === 'connecting')
      if (!joined) {
        // 채널에 붙는 사이 정리된 경우다. 이미 끝난 통화면 서버가 거절할 뿐이라 한 번 더 접어도 해가 없다
        await abandonCall(token, session.call.callId)
        return
      }
      // 상대가 아주 빨리 받으면 ACCEPTED 가 join 보다 먼저 도착한다.
      // 그때는 시그널이 넣어둔 최신 스냅샷을 살리고 바로 통화 중으로 넘어간다.
      const arrived = get().call
      const accepted = arrived?.status === 'ACCEPTED'
      set({
        phase: accepted ? 'active' : 'outgoing',
        call: arrived ?? session.call,
        session,
        activeSince: accepted ? Date.now() : null,
      })
    } catch (e) {
      await callEngine.leave()
      // 서버에 통화가 이미 만들어졌으면 접어야 상대 전화가 멈춘다
      await abandonCall(token, get().call?.callId)
      // 예전 버전에서 끊기지 못하고 서버에 남은 통화가 있으면 계속 409 로 막힌다.
      // 사용자가 손쓸 방법이 없으므로 여기서 한 번 치워준다.
      let message = messageOf(e)
      if (e instanceof ApiError && e.code === 'CALL_ALREADY_IN_PROGRESS') {
        const cleared = await clearStaleCalls(token, roomId)
        if (cleared) message = '이전 통화가 정리되었어요. 다시 걸어주세요.'
      }
      set({ ...initial, devices: get().devices, deviceId: get().deviceId, error: message })
    }
  },

  accept: async (token) => {
    const { call, phase } = get()
    if (!call || phase !== 'incoming') return
    set({ phase: 'connecting' })
    try {
      // 받는 쪽도 수락 전에 권한을 먼저 확인한다.
      // 수락한 뒤에 거부하면 건 사람 화면은 통화 중인데 이쪽은 들어가지 못한 채로 갈린다.
      await ensureMediaPermission(call.callType === 'VIDEO')
      const session = await acceptCall(token, call.callId)
      const joined = await joinChannel(session, call.callType === 'VIDEO', () => get().phase === 'connecting')
      if (!joined) return
      set({
        phase: 'active',
        call: get().call ?? session.call,
        session,
        activeSince: Date.now(),
        // 받는 쪽도 마찬가지로 전체화면에서 통화를 시작한다
        expanded: true,
      })
    } catch (e) {
      await callEngine.leave()
      // 수락과 상대의 취소가 동시에 들어오면 서버는 한쪽만 받아주고 다른 쪽에는 409 를 준다.
      // 이때는 통화가 이미 끝났을 수 있어, 끊기 요청을 보내기 전에 서버 상태를 다시 받아 화면을 맞춘다
      if (e instanceof ApiError && e.status === 409) {
        const latest = await getCall(token, call.callId).catch(() => null)
        if (latest && isCallOver(latest.status)) {
          set({ ...initial, devices: get().devices, deviceId: get().deviceId, notice: noticeFor(latest, false, false) })
          return
        }
      }
      // 받지 못했으니 통화를 끊는다. 서버가 건 사람에게 거절/종료 시그널을 보내줘서
      // 상대 화면도 "상대방이 통화를 거절했어요" 로 닫힌다.
      await abandonCall(token, call.callId)
      set({ ...initial, devices: get().devices, deviceId: get().deviceId, error: messageOf(e) })
    }
  },

  resume: async (token) => {
    if (get().phase !== 'idle') return
    // 조회 자체가 실패하면 되살릴 통화가 있는지도 모르는 상태라, 아무것도 건드리지 않는다
    const active = await getActiveCall(token).catch(() => null)
    if (!active) return
    const call = active.call
    // 배포 버전이 다른 서버가 빈 객체를 돌려줄 수 있어, 복구에 필요한 상태와 참여자가 없으면 조용히 건너뛴다.
    if (
      !call ||
      (call.status !== 'RINGING' && call.status !== 'ACCEPTED') ||
      !call.caller?.username ||
      !call.callee?.username ||
      get().phase !== 'idle'
    ) return

    const { connection } = active
    const { me, peer } = participantsOf(call, get().myUsername)
    const base = {
      ...initial,
      devices: get().devices,
      deviceId: get().deviceId,
      call,
      peerNameHint: peer.name,
      peerImageUrl: peer.imageUrl ?? null,
    }

    // 받는 쪽이 아직 수락하지 않은 통화는 서버가 접속 정보를 주지 않는다.
    // 채널에는 붙지 않고, INVITED 를 받았을 때와 같은 벨 화면으로 되돌려 받거나 거절할 수 있게 한다
    if (!connection) {
      set({ ...base, phase: 'incoming', camOn: call.callType === 'VIDEO' })
      return
    }

    // 마이크·카메라는 끄기 전 상태를 서버가 들고 있다. 그대로 이어가야 상대 화면의 표시와 맞는다
    const video = me.videoEnabled
    set({ ...base, phase: 'connecting', micOn: me.audioEnabled, camOn: video, expanded: true })
    try {
      await ensureMediaPermission(video)
      const session = { ...connection, call }
      set({ session })
      const joined = await joinChannel(session, video, () => get().phase === 'connecting')
      if (!joined) return
      // join 은 마이크를 켠 채로 붙으므로, 꺼둔 상태였으면 다시 끈다
      if (!me.audioEnabled) await callEngine.setMic(false)
      // 화면공유는 별도 클라이언트로 송출하던 거라 새로고침과 함께 끊겼는데, 서버는 아직 공유 중으로 알고 있다.
      // 그대로 두면 상대 화면엔 공유 중 표시가 남고, 상대가 공유를 시작하려 하면 SCREEN_SHARE_OCCUPIED 로 막힌다.
      // 브라우저가 공유할 화면을 다시 골라야 해서 이어서 공유할 수는 없으니 서버 쪽 상태를 끈다.
      // 실패해도 통화 자체는 살릴 수 있어 재접속을 실패로 돌리지 않는다
      if (me.screenSharing) {
        const updated = await stopScreenShare(token, call.callId).catch(() => null)
        if (updated) set({ call: updated })
      }

      // 내가 건 통화가 아직 울리는 중이면 기다리는 화면으로, 이미 받은 통화면 통화 중으로 돌아간다.
      // 접속하는 사이 상대가 받았을 수 있어 시그널이 넣어둔 최신 상태를 먼저 본다
      const latest = get().call ?? call
      const accepted = latest.status === 'ACCEPTED'
      set({
        phase: accepted ? 'active' : 'outgoing',
        call: latest,
        // 통화 시간이 새로고침 때문에 0 부터 다시 세지지 않도록 서버의 시작 시각을 쓴다
        activeSince: accepted ? (latest.startedAt ? Date.parse(latest.startedAt) : Date.now()) : null,
      })
    } catch {
      // 반쯤 붙은 채로 남으면 상대는 통화 중인데 나는 소리가 안 들리는 상태가 된다. 채널과 서버 통화를 모두 접는다
      await callEngine.leave()
      await abandonCall(token, call.callId)
      set({ ...initial, devices: get().devices, deviceId: get().deviceId, error: '진행 중이던 통화에 다시 연결하지 못했어요.' })
    }
  },

  handlePeerLeft: (getToken) => {
    const { phase } = get()
    // 벨만 울리는 단계는 채널에 아무도 없어 기다릴 상대가 없다
    if (phase === 'idle' || phase === 'incoming' || peerLeftTimer) return
    set({ peerReconnecting: true })
    peerLeftTimer = setTimeout(() => {
      peerLeftTimer = null
      // 같은 uid 로 다시 붙었는데 이전 접속의 이탈 이벤트만 늦게 온 경우다. 상대는 이미 돌아와 있다
      if (callEngine.hasRemotePeer()) {
        set({ peerReconnecting: false })
        return
      }
      const state = get()
      if (state.phase === 'idle' || state.phase === 'incoming') return
      state.setNotice('상대방과의 연결이 끊어졌어요.')
      const token = getToken()
      if (token) void state.hangUp(token)
      else void state.reset()
    }, PEER_RECONNECT_TIMEOUT_MS)
  },

  handlePeerJoined: () => {
    clearPeerLeftTimer()
    if (get().peerReconnecting) set({ peerReconnecting: false })
  },

  // 끊기는 /end 하나로 통일한다. RINGING 이면 서버가 발신자는 취소, 수신자는 거절로 처리한다.
  hangUp: async (token) => {
    const { call, screenOn } = get()

    await get().reset()
    if (!call) return
    // 공유 중에 끊으면 서버에 점유 상태가 남을 수 있다.
    // 통화가 끝나면 서버가 같이 정리해줄 가능성이 높지만, 남으면 상대가 다음 통화에서
    // 화면공유를 못 하게 되므로 명시적으로 먼저 풀고 끊는다.
    if (screenOn) await stopScreenShare(token, call.callId).catch(() => {})
    try {
      await endCall(token, call.callId)
    } catch {
      // 이미 서버에서 종료된 통화. 화면은 위에서 이미 닫았으므로 알릴 것이 없다.
    }
  },

  toggleMic: async (token) => {
    const { micOn, camOn, call } = get()
    const next = !micOn
    set({ micOn: next })
    await callEngine.setMic(next)
    if (call) {
      // 상대 화면의 마이크 아이콘을 갱신하려면 서버에도 알려야 한다
      await updateCallMedia(token, call.callId, { audioEnabled: next, videoEnabled: camOn }).catch(() => {})
    }
  },

  // 음성으로 시작한 통화도 그냥 켜진다. 토큰에 영상 권한이 이미 들어 있어 재발급이 필요 없다.
  toggleCam: async (token) => {
    const { camOn, micOn, call, busy } = get()
    if (busy) return
    const next = !camOn
    set({ busy: true })
    try {
      await callEngine.setCamera(next)
      set({ camOn: next, expanded: next ? true : get().expanded, cameraFacing: callEngine.cameraFacing })
      if (next) void callEngine.hasMultipleCameras().then((canFlipCamera) => set({ canFlipCamera }))
      if (call) {
        await updateCallMedia(token, call.callId, { audioEnabled: micOn, videoEnabled: next }).catch(() => {})
      }
    } catch (e) {
      set({ error: messageOf(e) })
    } finally {
      set({ busy: false })
    }
  },

  flipCamera: async () => {
    const { camOn, busy } = get()
    if (!camOn || busy) return
    set({ busy: true })
    try {
      set({ cameraFacing: await callEngine.flipCamera() })
    } catch (e) {
      set({ error: messageOf(e) })
    } finally {
      set({ busy: false })
    }
  },

  toggleScreen: async (token) => {
    const { screenOn, call, busy } = get()
    if (!call || busy) return
    set({ busy: true })
    try {
      if (screenOn) {
        await callEngine.stopScreen()
        set({ screenOn: false })
        // 이걸 빼먹으면 서버에 점유 상태가 남아 상대가 화면공유를 못 한다
        await stopScreenShare(token, call.callId).catch(() => {})
      } else {
        const session = await startScreenShare(token, call.callId)
        try {
          await callEngine.startScreen(session)
          set({ screenOn: true, call: session.call, expanded: true })
        } catch (e) {
          // 공유 선택창에서 취소한 경우. 서버 점유는 풀어줘야 다음에 다시 시도할 수 있다.
          await stopScreenShare(token, call.callId).catch(() => {})
          throw e
        }
      }
    } catch (e) {
      // 사용자가 공유 선택창을 닫은 것뿐이면 에러 배너까지 띄울 필요는 없다
      const canceled = e instanceof Error && /Permission denied|NotAllowedError/i.test(e.message + e.name)
      if (!canceled) set({ error: messageOf(e) })
    } finally {
      set({ busy: false })
    }
  },

  refreshDevices: async () => {
    const devices = await callEngine.listPlaybackDevices()
    set({ devices })
  },

  selectDevice: async (deviceId) => {
    set({ deviceId })
    await callEngine.setPlaybackDevice(deviceId)
  },

  renew: async (token) => {
    const { call, phase } = get()
    if (!call) return
    // 받기 전(RINGING)인 수신자가 토큰을 요청하면 서버가 409 로 막는다. 수락 응답에 토큰이 같이 오므로 여기서 받을 일이 없다
    if (phase === 'incoming') return
    // RTC 토큰 유효 시간이 600초로 짧아져, 갱신이 한 번 실패하고 끝나면 10분 만에 통화가 끊긴다.
    // 만료 알림(token-privilege-will-expire)은 만료 30초 전에 오므로 그 안에서 몇 번 다시 시도한다
    for (let attempt = 0; attempt < TOKEN_RENEW_ATTEMPTS; attempt++) {
      if (get().call?.callId !== call.callId) return
      try {
        const session = await renewCallToken(token, call.callId)
        await callEngine.renewToken(session.rtcToken)
        set({ session })
        return
      } catch (e) {
        // 이미 끝났거나 받을 수 없는 통화라면 다시 시도해도 같은 답이 온다
        if (e instanceof ApiError && (e.status === 404 || e.status === 409)) return
        await new Promise((r) => setTimeout(r, TOKEN_RENEW_RETRY_MS))
      }
    }
  },

  reset: async () => {
    // 어느 길로 끝났든 대기 타이머가 남아 있으면 다음 통화를 엉뚱하게 끊는다
    clearPeerLeftTimer()
    await callEngine.leave()
    // 고른 출력 장치는 통화마다 다시 고르게 하지 않는다.
    // notice("왜 끝났는지")는 통화가 끝난 뒤에 쓰이므로 여기서 같이 지우면 안 된다.
    const { devices, deviceId, notice } = get()
    set({ ...initial, devices, deviceId, notice })
  },
}))
