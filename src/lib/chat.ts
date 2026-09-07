import { throwApiError } from './apiError'
import {
  cacheMessages,
  clearMessagesBefore,
  clearRoomsBefore,
  getCachedMessages,
  deleteRoomCache,
} from './chatDb'
import type { CachedMessage } from './chatDb'

// 채팅방 나가기는 서버에서 소프트 삭제라 roomId 가 그대로 유지된다.
// 나갔다가 같은 상대·같은 포스트로 다시 방을 만들면 서버는 같은 roomId 를 돌려주는데,
// 서버는 clearBefore 이후 메시지만 내려줘도 로컬 캐시에는 예전 메시지가 남아 있다.
// 그래서 방 정보를 받을 때마다 clearBefore 기준으로 로컬 캐시를 직접 정리한다.

export interface ChatRoom {
  roomId: number
  // 이 시각 이전 메시지는 이 사용자에게 보이면 안 된다. 나간 적이 없으면 null.
  clearBefore: string | null
  [key: string]: unknown
}

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// 응답이 { data: ... } 로 감싸져 오는 경우와 아닌 경우를 모두 받아준다
function unwrap<T>(json: unknown): T {
  const body = json as { data?: T }
  return (body && typeof body === 'object' && 'data' in body ? body.data : json) as T
}

// 메시지 목록은 배열로 오기도 하고 { content: [...] } 페이징 형태로 오기도 한다
function toMessageList(json: unknown): CachedMessage[] {
  const raw = unwrap<unknown>(json)
  if (Array.isArray(raw)) return raw as CachedMessage[]
  const paged = raw as { content?: CachedMessage[] }
  return paged?.content ?? []
}

export async function getChatRooms(token: string) {
  const res = await fetch(`/api/chat/rooms`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()

  // 목록을 받은 김에 나갔던 방들의 로컬 캐시를 한 번에 정리한다
  const rooms = unwrap<ChatRoom[]>(json)
  if (Array.isArray(rooms)) await clearRoomsBefore(rooms)

  return json
}

export async function createChatRoom(token: string, username: string, postId: number) {
  const res = await fetch(`/api/chat/rooms`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ username, postId }),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()

  // 방 재입장 시점이라 여기서 안 지우면 화면에 옛 대화가 그대로 남는다
  const room = unwrap<ChatRoom>(json)
  if (room?.roomId != null) {
    await clearMessagesBefore(room.roomId, room.clearBefore ?? null)
  }

  return json
}

export async function getChatMessages(token: string, roomId: number) {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// 서버 메시지와 로컬 캐시를 합쳐서 화면에 뿌릴 목록을 만든다.
//
// 서버는 최근 3일치만 갖고 있어서 "서버에 없으면 지운다" 식 머지를 하면
// 정상적인 과거 메시지까지 날아간다. 삭제 기준은 clearBefore 하나뿐이다.
export async function loadChatMessages(
  token: string,
  roomId: number,
  clearBefore: string | null = null
): Promise<CachedMessage[]> {
  await clearMessagesBefore(roomId, clearBefore)

  const json = await getChatMessages(token, roomId)
  await cacheMessages(toMessageList(json))

  return getCachedMessages(roomId)
}

export async function deleteChatRoom(token: string, roomId: number) {
  const res = await fetch(`/api/chat/rooms/${roomId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)

  // 나간 방의 캐시는 통째로 비운다
  await deleteRoomCache(roomId)

  return res.json()
}
