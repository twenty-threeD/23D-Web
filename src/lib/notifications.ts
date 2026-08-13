import { throwApiError } from './apiError'

export type NotificationKind = 'CHAT' | 'NOTICE'

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

function dispatch(rawEvent: string, handlers: NotificationHandlers): number | null {
  let eventName = 'message'
  let eventId: number | null = null
  const dataLines: string[] = []
  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    else if (line.startsWith('id:')) eventId = Number(line.slice(3).trim()) || null
  }
  if (eventName === 'chat' || eventName === 'notice') {
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
      if (!res.ok || !res.body) throw new Error('subscribe failed')

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

    if (!stopped) {
      retryTimer = setTimeout(connect, RECONNECT_MS)
    }
  }

  connect()

  return () => {
    stopped = true
    if (retryTimer) clearTimeout(retryTimer)
    controller?.abort()
  }
}
