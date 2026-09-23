// 거래 완료·취소 규약.
//
// 백엔드에 채팅방(거래) 상태 필드가 없어서, 계약서·결제와 같은 "대괄호 접두사 + JSON" 메시지로
// 상태를 남기고 메시지 목록에서 거꾸로 읽어낸다.
//
// 종료 메시지([거래 완료]/[거래 취소])를 보낸 뒤에는 입력을 막으므로 그 메시지가 방의 마지막 메시지로 남는다.
// 그래서 방 목록의 lastMessagePreview 만 보고도 완료된 거래인지 가를 수 있다.
// 백엔드에 상태 필드가 생기면 이 파일을 걷어내고 그 값을 쓰면 된다.

export const DEAL_REQUEST_PREFIX = '[거래 완료 요청]\n'
export const DEAL_COMPLETE_PREFIX = '[거래 완료]\n'
export const DEAL_CANCEL_PREFIX = '[거래 취소]\n'

export interface DealRequest {
  orderName?: string
  amount?: number
}

export interface DealEnd {
  kind: 'completed' | 'canceled'
  // 누가 끝냈는지. 카드 문구("취소했어요"/"취소됐어요")를 가르는 데 쓴다
  by: string
}

export function formatDealRequest(req: DealRequest) {
  return `${DEAL_REQUEST_PREFIX}${JSON.stringify(req)}`
}

export function formatDealEnd(kind: DealEnd['kind'], by: string) {
  return `${kind === 'completed' ? DEAL_COMPLETE_PREFIX : DEAL_CANCEL_PREFIX}${JSON.stringify({ by })}`
}

function parseJson<T>(text: string, prefix: string): T | null {
  if (!text?.startsWith(prefix)) return null
  try {
    return (JSON.parse(text.slice(prefix.length)) ?? {}) as T
  } catch {
    return {} as T
  }
}

export function parseDealRequest(text: string): DealRequest | null {
  return parseJson<DealRequest>(text, DEAL_REQUEST_PREFIX)
}

export function parseDealEnd(text: string): DealEnd | null {
  const done = parseJson<{ by?: string }>(text, DEAL_COMPLETE_PREFIX)
  if (done) return { kind: 'completed', by: done.by ?? '' }
  const canceled = parseJson<{ by?: string }>(text, DEAL_CANCEL_PREFIX)
  if (canceled) return { kind: 'canceled', by: canceled.by ?? '' }
  return null
}

// 방 목록 미리보기는 줄바꿈이 잘려 올 수 있어 접두사 머리만 본다
export function isDealEndPreview(text?: string | null) {
  return !!text && (text.startsWith('[거래 완료]') || text.startsWith('[거래 취소]'))
}

// 끝난 거래 방을 같은 post 로 다시 열면 같은 roomId 에 [채팅 시작]이 새로 붙는다.
// 그래서 "마지막 종료 메시지 뒤에 새 채팅 시작이 없으면" 닫힌 방으로 본다.
export function isDealClosed(messages: readonly unknown[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const text = (messages[i] as { message?: string | null } | undefined)?.message ?? ''
    if (text.startsWith('[채팅 시작]')) return false
    if (isDealEndPreview(text)) return true
  }
  return false
}
