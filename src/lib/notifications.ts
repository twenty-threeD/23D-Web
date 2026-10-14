import { throwApiError } from './apiError'

// CALL_MISSED: 받지 못한 전화. roomId 로 그 통화가 걸려온 채팅방을 알려준다
export type NotificationKind = 'CHAT' | 'NOTICE' | 'CALL_MISSED'

export interface NotificationResponse {
  notificationId: number | null
  type: NotificationKind
  senderUsername: string | null
  senderName: string | null
  receiverUsername: string
  message: string
  sentAt: string
  roomId: number | null
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function getNotifications(token: string): Promise<NotificationResponse[]> {
  const res = await fetch('/api/notifications', { headers: authHeaders(token) })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data ?? []
}

export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', { headers: authHeaders(token) })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data?.unreadCount ?? 0
}

// 읽은 알림은 서버에서 삭제되는 방식이라, 이미 읽혀 없어진 알림(404)은 성공으로 취급한다.
export async function readNotification(token: string, notificationId: number): Promise<void> {
  const res = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok && res.status !== 404) await throwApiError(res)
}

export async function readAllNotifications(token: string): Promise<void> {
  const res = await fetch('/api/notifications', { method: 'DELETE', headers: authHeaders(token) })
  if (!res.ok) await throwApiError(res)
}

interface NotificationHandlers {
  onNotification?: (notification: NotificationResponse) => void
}

const RECONNECT_MS = 3000
// 서버가 내려가 있거나 네트워크가 끊긴 동안 3초마다 두드리지 않게, 실패가 이어지면 간격을 늘린다
const MAX_RECONNECT_MS = 60_000

function dispatch(rawEvent: string, handlers: NotificationHandlers): number | null {
  let eventName = 'message'
  let eventId: number | null = null
  const dataLines: string[] = []
  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    else if (line.startsWith('id:')) eventId = Number(line.slice(3).trim()) || null
  }
  // 부재중 통화 알림이 어떤 SSE 이벤트 이름으로 오는지 스펙에 없어, 대소문자·구분자 차이를 모두 받는다
  if (eventName === 'chat' || eventName === 'notice' || /^call[_-]?missed$/i.test(eventName)) {
    try {
      handlers.onNotification?.(JSON.parse(dataLines.join('\n')))
    } catch {}
  }
  return eventId
}

// EventSource는 커스텀 헤더(Authorization)를 지원하지 않고 Last-Event-ID 재전송 시점도 제어할 수 없어 fetch 스트림으로 SSE를 직접 파싱한다.
export function subscribeToNotifications(token: string, handlers: NotificationHandlers): () => void {
  let stopped = false
  let controller: AbortController | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let lastEventId: number | null = null
  let failures = 0
  // 토큰이 거절되면 같은 토큰으로 다시 붙어도 계속 거절된다. 토큰이 바뀌면 훅이 새로 구독하므로 여기서는 멈춘다
  let rejected = false

  async function connect() {
    if (stopped) return
    controller = new AbortController()

    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
      // 재연결 시 서버가 이 값 이후에 쌓인, 끊긴 동안 놓친 알림을 다시 흘려보내준다.
      if (lastEventId !== null) headers['Last-Event-ID'] = String(lastEventId)

      const res = await fetch('/api/notifications/subscribe', {
        headers,
        signal: controller.signal,
      })
      if (res.status === 401 || res.status === 403) rejected = true
      if (!res.ok || !res.body) throw new Error('subscribe failed')
      failures = 0

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!stopped) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let sepIndex: number
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex)
          buffer = buffer.slice(sepIndex + 2)
          const id = dispatch(rawEvent, handlers)
          if (id !== null) lastEventId = id
        }
      }
    } catch {
      // 연결 실패/중단 시 아래에서 재연결
    }

    if (!stopped && !rejected) {
      failures++
      retryTimer = setTimeout(connect, Math.min(RECONNECT_MS * 2 ** (failures - 1), MAX_RECONNECT_MS))
    }
  }

  connect()

  return () => {
    stopped = true
    if (retryTimer) clearTimeout(retryTimer)
    controller?.abort()
  }
}
