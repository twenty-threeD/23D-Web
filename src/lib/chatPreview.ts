export interface ChatStartInfo {
  starter: string
  planName: string
  price: string
}

// 문의하기로 방이 열릴 때 자동 발송되는 안내 메시지.
// 예전에는 평문이었고 지금은 JSON이라 둘 다 읽을 수 있어야 한다.
export function parseChatStart(text: string): ChatStartInfo | null {
  const PREFIX = "[채팅 시작]\n"
  if (!text.startsWith(PREFIX)) return null
  const body = text.slice(PREFIX.length)

  try {
    const parsed = JSON.parse(body)
    return {
      starter: parsed.starter ?? "",
      planName: parsed.planName ?? "",
      price: parsed.price ?? "",
    }
  } catch {
    const lines = body.split("\n")
    return {
      starter: lines[0]?.replace(/님이 채팅을 시작했어요$/, "") ?? "",
      planName: lines.find((l) => l.startsWith("선택한 서비스:"))?.replace("선택한 서비스:", "").trim() ?? "",
      price: "",
    }
  }
}

// 채팅 목록 미리보기·알림 본문. 대괄호 접두사로 주고받는 특수 메시지는 원문 대신 짧은 문구로 보여준다
// (JSON 본문이 그대로 노출되거나 줄바꿈이 이어붙어 길어지는 걸 막는다).
export function previewOf(text: string) {
  if (!text) return ""
  if (text.startsWith("[계약서 제안]")) return "📄 계약서를 보냈습니다."
  if (text.startsWith("[계약서 체결 완료]")) return "✅ 계약이 체결됐습니다."
  if (text.startsWith("[결제 완료]")) return "💳 결제가 완료됐습니다."
  if (text.startsWith("[견적서 발송]")) return "🧾 견적서를 보냈습니다."
  const start = parseChatStart(text)
  if (start) return start.planName ? `선택한 서비스: ${start.planName}` : "채팅을 시작했어요"
  // 백엔드가 만드는 PAYMENT 타입 메시지처럼 접두사 없이 JSON만 오는 경우도 원문 노출을 막는다.
  if (text.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === "object") {
        return "orderId" in parsed || "amount" in parsed ? "💳 결제가 완료됐습니다." : "새 메시지가 도착했습니다."
      }
    } catch {}
  }
  return text.replace(/\n+/g, " ")
}
