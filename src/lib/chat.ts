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
export function unwrap<T>(json: unknown): T {
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

export const MESSAGE_PAGE_SIZE = 50

// 서버는 모든 응답을 오래된 → 최신 순으로 준다.
// after: 이 id 보다 새 메시지 (델타 동기화), cursor: 이 id 보다 오래된 메시지 (위로 스크롤).
// offset/page 파라미터는 없으니 반드시 커서로만 요청한다.
export async function getChatMessages(
  token: string,
  roomId: number,
  params: { after?: number; cursor?: number; size?: number } = {}
) {
  const query = new URLSearchParams()
  if (params.after != null) query.set('after', String(params.after))
  if (params.cursor != null) query.set('cursor', String(params.cursor))
  if (params.size != null) query.set('size', String(params.size))
  const qs = query.toString()

  const res = await fetch(`/api/chat/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// messageId 기준으로 합치고 정렬한다.
// 델타 동기화와 소켓 수신이 겹치면 같은 메시지가 두 번 들어오기 때문이다.
// id 없는 메시지(드물게 소켓에서 오는 경우)는 버리지 않고 뒤에 둔다.
export function mergeMessages<T extends { messageId?: number | null }>(prev: T[], incoming: T[]): T[] {
  const byId = new Map<number, T>()
  const noId: T[] = []
  for (const m of [...prev, ...incoming]) {
    if (m?.messageId == null) noId.push(m)
    else byId.set(m.messageId, m)
  }
  const sorted = [...byId.values()].sort((a, b) => (a.messageId as number) - (b.messageId as number))
  return [...sorted, ...noId]
}

function maxMessageId(list: CachedMessage[]): number | null {
  let max: number | null = null
  for (const m of list) if (m.messageId != null && (max == null || m.messageId > max)) max = m.messageId
  return max
}

// 방 진입 직후 네트워크 없이 바로 그릴 캐시. 나갔던 방이면 clearBefore 이전은 먼저 걷어낸다.
export async function loadCachedChatMessages(
  roomId: number,
  clearBefore: string | null = null
): Promise<CachedMessage[]> {
  try {
    await clearMessagesBefore(roomId, clearBefore)
    return await getCachedMessages(roomId)
  } catch {
    // 캐시는 렌더 보조일 뿐이라 실패해도 서버 동기화로 채우면 된다
    return []
  }
}

// 캐시 이후로 새로 생긴 메시지를 받아온다.
// 캐시가 비었으면 파라미터 없이 최신 50개, 있으면 after=<캐시 최대 id> 로 시작해
// 한 페이지가 꽉 차 있는 동안은 남은 게 있다고 보고 이어서 요청한다.
export async function syncChatMessages(
  token: string,
  roomId: number,
  cached: CachedMessage[]
): Promise<CachedMessage[]> {
  let after = maxMessageId(cached)
  const received: CachedMessage[] = []

  for (;;) {
    const json =
      after == null
        ? await getChatMessages(token, roomId)
        : await getChatMessages(token, roomId, { after, size: MESSAGE_PAGE_SIZE })
    const page = toMessageList(json)
    received.push(...page)

    // 최초 로드(after 없음)는 최신 50개면 충분하다. 그 이전은 위로 스크롤할 때 cursor 로 받는다.
    if (after == null || page.length < MESSAGE_PAGE_SIZE) break
    const last = maxMessageId(page)
    if (last == null || last <= after) break
    after = last
  }

  void cacheMessages(received).catch(() => {})
  return received
}

// 위로 스크롤할 때 현재 가진 것 중 가장 오래된 id 이전 페이지를 받는다. 빈 배열이면 끝이다.
export async function loadOlderChatMessages(
  token: string,
  roomId: number,
  cursor: number
): Promise<CachedMessage[]> {
  const json = await getChatMessages(token, roomId, { cursor, size: MESSAGE_PAGE_SIZE })
  const page = toMessageList(json)
  void cacheMessages(page).catch(() => {})
  return page
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
