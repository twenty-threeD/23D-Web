// 거래 카드용 채팅 메시지 규약.
//
// 거래 상태 자체는 서버(ChatRoom.tradeStatus)가 갖는다. 여기 남은 건 대화 흐름에 카드를 남기기 위한 메시지뿐이다.
// - [거래 취소]: 수동 취소를 상대에게 알리고 그 자리에 카드를 남긴다
// - [거래 완료 요청] · [거래 완료]: 결제 후 갑이 직접 완료를 누르던 예전 방식의 흔적. 지난 대화를 그리려고 읽기만 한다

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

export function formatDealCancel(by: string) {
  return `${DEAL_CANCEL_PREFIX}${JSON.stringify({ by })}`
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
