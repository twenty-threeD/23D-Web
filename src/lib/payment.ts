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
  if (!res.ok) throw new Error('결제 승인 실패')
  return res.json()
}

// 가상계좌 발급
export async function createVirtualAccount(
  token: string,
  data: {
    orderId: string
    orderName: string
    amount: number
    customerName: string
    bank: string
    dueDate?: string
  }
) {
  const res = await fetch(`/api/payment/virtual-accounts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('가상계좌 발급 실패')
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
  if (!res.ok) throw new Error('결제 취소 실패')
  return res.json()
}
