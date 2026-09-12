import { create } from 'zustand'
import type { IRemoteVideoTrack } from 'agora-rtc-sdk-ng'
import { callEngine, type PlaybackDevice, type RemoteVideoKind } from '@/src/lib/agoraEngine'
import {
  acceptCall,
  endCall,
  isCallOver,
  renewCallToken,
  startCall,
  startScreenShare,
  stopScreenShare,
  updateCallMedia,
  type Call,
  type CallSession,
  type CallSignalEvent,
  type CallStatus,
  type CallType,
} from '@/src/lib/call'
import { formatCallLogMessage } from '@/src/lib/callLog'
import { ApiError } from '@/src/lib/apiError'

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
  // 채팅방에 남길 통화 기록. CallProvider 가 STOMP 로 보내고 비운다.
  pendingLog: { roomId: number; message: string } | null
  // 전체화면 여부. 통화는 우하단 도크에서 시작하고, 영상이 붙으면 그때 넓힌다.
  // 벨이 울리는 것만으로 화면을 덮으면 하던 일을 가린다.
  expanded: boolean

  setMyUsername: (username: string | null) => void
  applySignal: (event: CallSignalEvent) => void
  setRemoteVideo: (kind: RemoteVideoKind, track: IRemoteVideoTrack | null) => void
  setError: (message: string | null) => void
  setNotice: (message: string | null) => void
  clearPendingLog: () => void
  setExpanded: (expanded: boolean) => void

  start: (
    token: string,
    roomId: number,
    callType: CallType,
    peer?: { name?: string | null; imageUrl?: string | null }
  ) => Promise<void>
  accept: (token: string) => Promise<void>
  hangUp: (token: string) => Promise<void>
  toggleMic: (token: string) => Promise<void>
  toggleCam: (token: string) => Promise<void>
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
  pendingLog: null,
  expanded: false,
}

// 통화가 끝나는 길이 여러 개다(내가 끊기 / 서버 종료 시그널 / 무응답 타임아웃).
// 어느 길로 끝나든 기록은 한 번만 남아야 해서 이미 남긴 통화를 기억해둔다.
const loggedCalls = new Set<number>()

function buildCallLog(
  call: Call,
  myUsername: string | null,
  status: CallStatus,
  durationSeconds: number
): { roomId: number; message: string } | null {
  // 양쪽이 다 보내면 같은 통화가 두 번 찍힌다. 건 사람만 남긴다.
  if (call.caller.username !== myUsername) return null
  if (loggedCalls.has(call.callId)) return null
  loggedCalls.add(call.callId)
  return {
    roomId: call.roomId,
    message: formatCallLogMessage({ callType: call.callType, status, durationSeconds }),
  }
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
  if (e instanceof ApiError) {
    // UI 안내가 필요한 두 가지. 서버 문구가 영문이라 여기서 바꿔 보여준다.
    if (e.code === 'CALL_ALREADY_IN_PROGRESS') return '이미 진행 중인 통화가 있어요.'
    if (e.code === 'SCREEN_SHARE_OCCUPIED') return '상대방이 화면을 공유하고 있어요.'
    // 서버 예외는 사용자가 할 수 있는 게 없지만, 백엔드와 맞춰보는 동안에는
    // 상태 코드가 화면에 보여야 어디를 봐야 할지 바로 알 수 있다.
    if (e.status >= 500) return `서버 오류로 통화를 시작하지 못했어요. (${e.status}${e.code ? ` ${e.code}` : ''})`
    return e.message
  }
  if (e instanceof Error && e.name === 'NotAllowedError') {
    return '마이크·카메라 권한이 필요해요. 브라우저 주소창의 권한 설정을 확인해주세요.'
  }
  return '통화를 연결하지 못했어요.'
}

export const useCallStore = create<CallStore>()((set, get) => ({
  ...initial,
  myUsername: null,

  setMyUsername: (myUsername) => set({ myUsername }),
  setError: (error) => set({ error }),
  setNotice: (notice) => set({ notice }),
  clearPendingLog: () => set({ pendingLog: null }),
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
      // 서버 스냅샷이 최종 status·통화시간을 들고 있어 기록으로는 이쪽이 가장 정확하다
      set({
        notice: noticeFor(call, iAmCaller, fromUsername === state.myUsername),
        pendingLog:
          buildCallLog(call, state.myUsername, call.status, call.durationSeconds ?? 0) ??
          state.pendingLog,
      })
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
      const session = await startCall(token, roomId, callType)
      // 채널에 붙기 전에 먼저 들고 있는다.
      // 이게 없으면 접속하는 몇 초 사이에 끊었을 때 callId 를 몰라 서버에 종료를 못 알리고,
      // 화면만 닫힌 채 상대 전화는 계속 울린다.
      set({ call: session.call, session })
      callEngine.setScreenUids([session.call.caller.screenUid, session.call.callee.screenUid])
      await callEngine.join(session, { video: callType === 'VIDEO' })

      // 채널에 붙는 동안 상대가 거절해서 이미 정리된 통화면 그대로 접는다
      if (get().phase !== 'connecting') {
        await callEngine.leave()
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
      set({ ...initial, devices: get().devices, deviceId: get().deviceId, error: messageOf(e) })
    }
  },

  accept: async (token) => {
    const { call, phase } = get()
    if (!call || phase !== 'incoming') return
    set({ phase: 'connecting' })
    try {
      // accept 응답이 발신 때와 똑같은 모양이라 join 코드를 그대로 재사용한다
      const session = await acceptCall(token, call.callId)
      callEngine.setScreenUids([session.call.caller.screenUid, session.call.callee.screenUid])
      await callEngine.join(session, { video: call.callType === 'VIDEO' })

      // 붙는 동안 상대가 끊었으면(reset 이 돌아 phase 가 idle 이 된다) 되돌린다
      if (get().phase !== 'connecting') {
        await callEngine.leave()
        return
      }
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
      set({ ...initial, devices: get().devices, deviceId: get().deviceId, error: messageOf(e) })
    }
  },

  // 끊기는 /end 하나로 통일한다. RINGING 이면 서버가 발신자는 취소, 수신자는 거절로 처리한다.
  hangUp: async (token) => {
    const { call, screenOn, phase, activeSince, myUsername } = get()

    // 서버 종료 시그널이 오면 그쪽이 더 정확하지만, 안 올 수도 있으니 여기서도 남긴다.
    // buildCallLog 가 callId 로 중복을 막으므로 둘 중 먼저 도착한 쪽만 기록된다.
    if (call) {
      const status: CallStatus =
        phase === 'active' ? 'ENDED' : phase === 'incoming' ? 'REJECTED' : 'CANCELED'
      const duration = activeSince ? Math.floor((Date.now() - activeSince) / 1000) : 0
      const log = buildCallLog(call, myUsername, status, duration)
      if (log) set({ pendingLog: log })
    }

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
      set({ camOn: next, expanded: next ? true : get().expanded })
      if (call) {
        await updateCallMedia(token, call.callId, { audioEnabled: micOn, videoEnabled: next }).catch(() => {})
      }
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
    const { call } = get()
    if (!call) return
    try {
      const session = await renewCallToken(token, call.callId)
      await callEngine.renewToken(session.rtcToken)
      set({ session })
    } catch {
      // 갱신 실패해도 만료 전까지는 통화가 유지된다. 끊기면 서버가 ENDED 를 쏴준다.
    }
  },

  reset: async () => {
    await callEngine.leave()
    // 고른 출력 장치는 통화마다 다시 고르게 하지 않는다.
    // notice("왜 끝났는지")와 pendingLog(채팅에 남길 기록)는 통화가 끝난 뒤에 쓰이므로
    // 여기서 같이 지우면 안 된다.
    const { devices, deviceId, notice, pendingLog } = get()
    set({ ...initial, devices, deviceId, notice, pendingLog })
  },
}))
