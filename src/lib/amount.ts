import { ApiError } from './apiError'

// 계약 금액(price)·결제 금액(amount)의 서버 하한. 미만이면 서버가 400 INVALID_ARGUMENT 로 거절한다.
// 입력 단계에서 같은 기준으로 막아야 하므로 한 곳에 두고 같이 쓴다.
export const MIN_AMOUNT = 1000

export const MIN_AMOUNT_MESSAGE = `금액은 ${MIN_AMOUNT.toLocaleString()}원 이상이어야 해요.`

export function isBelowMinAmount(amount: number) {
  return !Number.isFinite(amount) || amount < MIN_AMOUNT
}

// 입력 단계에서 막아도, 예전에 만든 계약처럼 이미 하한 미만인 값이 서버로 갈 수 있다.
// 서버는 필드 검증 실패를 INVALID_ARGUMENT 하나로 묶고 어떤 필드인지는 details 에만 담아,
// 공통 처리로 넘기면 "요청값이 유효하지 않습니다." 만 보여 원인을 알 수 없다.
export function isAmountRejected(e: unknown, field: 'price' | 'amount') {
  return e instanceof ApiError && e.code === 'INVALID_ARGUMENT' && !!e.details?.[field]
}
