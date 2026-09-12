import { throwApiError } from './apiError'

// 아고라 통화 REST 래퍼.
// 서버는 토큰 발급 + 시그널링(STOMP /user/queue/call)까지만 하고,
// 실제 미디어 송수신은 전부 클라이언트(agoraEngine.ts) 몫이다.

export type CallType = 'VOICE' | 'VIDEO'
export type CallStatus = 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'MISSED' | 'ENDED'

// 서버가 /user/queue/call 로 흘려보내는 시그널 9종
export type CallSignal =
  | 'INVITED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELED'
  | 'MISSED'
  | 'ENDED'
  | 'MEDIA_CHANGED'
  | 'SCREEN_SHARE_STARTED'
  | 'SCREEN_SHARE_STOPPED'

export interface CallParticipant {
  username: string
  name: string
  // 아고라 채널 안에서의 식별자. 카메라용 uid 와 화면공유용 screenUid 가 따로 있다.
  uid: number
  screenUid: number
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
}

export interface Call {
  callId: number
  roomId: number
  callType: CallType
  status: CallStatus
  caller: CallParticipant
  callee: CallParticipant
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  durationSeconds: number | null
}

// 채널 접속에 필요한 것이 한 번에 온다 (POST /api/call, /accept, /token)
export interface CallSession {
  call: Call
  appId: string
  channelName: string
  uid: number
  rtcToken: string
  tokenExpiresAt: string
}

// 화면공유는 같은 채널에 별도 uid 로 한 번 더 접속하는 방식이라 전용 토큰을 따로 받는다
export interface ScreenShareSession {
  call: Call
  appId: string
  channelName: string
  screenUid: number
  rtcToken: string
  tokenExpiresAt: string
}

export interface CallSignalEvent {
  signal: CallSignal
  // 항상 최신 전체 상태 스냅샷이라 그대로 스토어에 넣으면 된다
  call: Call
  fromUsername: string
}

function authHeaders(token: string, json = false): Record<string, string> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

// 응답이 { data: ... } 로 감싸져 오는 경우와 아닌 경우를 모두 받아준다
function unwrap<T>(json: unknown): T {
  const body = json as { data?: T }
  return (body && typeof body === 'object' && 'data' in body ? body.data : json) as T
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...authHeaders(token, init?.body != null), ...(init?.headers ?? {}) },
  })
  if (!res.ok) await throwApiError(res)
  return unwrap<T>(await res.json())
}

export function startCall(token: string, roomId: number, callType: CallType) {
  return request<CallSession>('/api/call', token, {
    method: 'POST',
    body: JSON.stringify({ roomId, callType }),
  })
}

export function acceptCall(token: string, callId: number) {
  return request<CallSession>(`/api/call/${callId}/accept`, token, { method: 'POST' })
}

export function rejectCall(token: string, callId: number) {
  return request<Call>(`/api/call/${callId}/reject`, token, { method: 'POST' })
}

export function cancelCall(token: string, callId: number) {
  return request<Call>(`/api/call/${callId}/cancel`, token, { method: 'POST' })
}

// RINGING 상태면 서버가 알아서 발신자는 취소, 수신자는 거절로 처리해준다.
// 그래서 끊기 동작은 전부 이걸로 통일한다.
export function endCall(token: string, callId: number) {
  return request<Call>(`/api/call/${callId}/end`, token, { method: 'POST' })
}

// 로컬에서 껐다 켜는 것과 별개로, 상대 화면의 마이크/카메라 아이콘을 갱신하려면 서버에 알려야 한다.
// 토큰에 영상 권한이 이미 들어 있어서 음성으로 건 통화도 재발급 없이 카메라를 켤 수 있다.
export function updateCallMedia(
  token: string,
  callId: number,
  media: { audioEnabled: boolean; videoEnabled: boolean }
) {
  return request<Call>(`/api/call/${callId}/media`, token, {
    method: 'PATCH',
    body: JSON.stringify(media),
  })
}

export function renewCallToken(token: string, callId: number) {
  return request<CallSession>(`/api/call/${callId}/token`, token, { method: 'POST' })
}

export function startScreenShare(token: string, callId: number) {
  return request<ScreenShareSession>(`/api/call/${callId}/screen-share`, token, { method: 'POST' })
}

// 빼먹으면 서버에 점유 상태가 남아 상대가 화면공유를 못 한다
export function stopScreenShare(token: string, callId: number) {
  return request<Call>(`/api/call/${callId}/screen-share`, token, { method: 'DELETE' })
}

export function getCall(token: string, callId: number) {
  return request<Call>(`/api/call/${callId}`, token)
}

export function getRoomCalls(token: string, roomId: number) {
  return request<Call[]>(`/api/call/rooms/${roomId}`, token)
}

// 통화가 끝난 상태인지 (= UI 를 닫아야 하는지)
export function isCallOver(status: CallStatus): boolean {
  return status === 'REJECTED' || status === 'CANCELED' || status === 'MISSED' || status === 'ENDED'
}

// 내가 이 통화에서 어느 쪽인지. 상대 정보를 꺼낼 때 쓴다.
export function participantsOf(call: Call, myUsername: string | null) {
  const iAmCaller = !!myUsername && call.caller.username === myUsername
  return {
    iAmCaller,
    me: iAmCaller ? call.caller : call.callee,
    peer: iAmCaller ? call.callee : call.caller,
  }
}
