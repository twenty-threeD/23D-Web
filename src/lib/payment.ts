import { throwApiError } from './apiError'
import { invalidateMe } from './profile'

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// 결제 조회 (paymentKey)
export async function getPayment(token: string, paymentKey: string) {
  const res = await fetch(`/api/payment/${paymentKey}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('결제 조회 실패')
  return res.json()
}

// 결제 조회 (orderId)
export async function getPaymentByOrder(token: string, orderId: string) {
  const res = await fetch(`/api/payment/orders/${orderId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('주문 조회 실패')
  return res.json()
}

// 결제 사전 등록 (결제창을 띄우기 전에 반드시 호출해야 한다)
// 계약 금액을 등록하면 서버가 수수료와 을 정산액을 함께 계산해 반환한다.
export interface PreparedPayment {
  orderId: string
  amount: number
  feeAmount: number | null
  settlementAmount: number | null
}

export async function preparePayment(
  token: string,
  data: { orderId: string; amount: number; contractUrl: string; orderName?: string; roomId?: number; contractId: number }
): Promise<PreparedPayment> {
  const res = await fetch(`/api/payment/prepare`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  const payload: unknown = await res.json()
  const result = payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data?: unknown }).data
    : payload

  if (!result || typeof result !== 'object') {
    throw new Error('결제 준비 응답을 확인할 수 없습니다.')
  }

  return result as PreparedPayment
}

// 결제 승인 (토스페이먼츠 콜백 후 서버 최종 승인)
export async function confirmPayment(
  token: string,
  data: { paymentKey: string; orderId: string; amount: number }
) {
  const res = await fetch(`/api/payment/confirm`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  // 승인과 함께 서버가 방을 거래 완료로 바꾸고, 이 계약은 리뷰를 쓸 수 있게 된다. 들고 있던 내 쪽 데이터를 버린다
  invalidateMe()
  return res.json()
}

// 결제 취소
export async function cancelPayment(
  token: string,
  paymentKey: string,
  data: { cancelReason: string; cancelAmount?: number }
) {
  const res = await fetch(`/api/payment/${paymentKey}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  // 환불 한도 초과·환불할 금액 없음을 구분해 안내해야 해서 서버 에러 코드를 살려 던진다
  if (!res.ok) await throwApiError(res)
  // 전액 취소면 서버가 방을 거래 취소로 바꾼다
  invalidateMe()
  return res.json()
}
