export interface ChatNotification {
  roomId: number
  senderName: string
  message: string
  createdAt: string
}

interface NotificationHandlers {
  onChat?: (notification: ChatNotification) => void
}

const RECONNECT_MS = 3000

function dispatch(rawEvent: string, handlers: NotificationHandlers) {
  let eventName = "message"
  const dataLines: string[] = []
  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim()
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
  }
  if (eventName !== "chat") return
  try {
    handlers.onChat?.(JSON.parse(dataLines.join("\n")))
  } catch {}
}

// EventSource는 커스텀 헤더(Authorization)를 지원하지 않아 fetch 스트림으로 SSE를 직접 파싱한다.
export function subscribeToNotifications(token: string, handlers: NotificationHandlers): () => void {
  let stopped = false
  let controller: AbortController | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  async function connect() {
    if (stopped) return
    controller = new AbortController()

    try {
      const res = await fetch("/api/notifications/subscribe", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error("subscribe failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (!stopped) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let sepIndex: number
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex)
          buffer = buffer.slice(sepIndex + 2)
          dispatch(rawEvent, handlers)
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
