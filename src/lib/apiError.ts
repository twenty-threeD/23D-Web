export class ApiError extends Error {
  status: number
  code?: string
  // 요청 검증 실패(400 INVALID_ARGUMENT)일 때 어떤 필드가 틀렸는지 { 필드명: 사유 } 로 온다
  details?: Record<string, string>
  constructor(message: string, status: number, code?: string, details?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// 서버 문구만으로는 사용자가 무엇을 해야 할지 알기 어려운 코드. 여러 화면에서 같은 에러가 나서 여기서 한 번에 바꾼다
const MESSAGE_BY_CODE: Record<string, string> = {
  // 이메일 인증은 30분 동안만 유효하고 가입 한 번에 소비된다
  EMAIL_NOT_VERIFIED: '이메일 인증이 만료되었습니다. 이메일 인증을 다시 진행해주세요.',
  // 게시글 작성자가 빠진 채로 만들어진 예전 방은 거래 상태 변경·결제 준비가 막힌다
  NOT_POST_AUTHOR_ROOM: '서비스 작성자와의 채팅방에서만 거래를 진행할 수 있어요. 서비스 페이지에서 다시 문의해주세요.',
  // 같은 주소 하루 10통, 같은 IP 시간당 20통 제한이다
  EMAIL_SEND_LIMIT_EXCEEDED: '인증 메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요.',
  // 메일 서버 장애. 예전에는 500 으로 와서 원인을 알 수 없었다
  EMAIL_CANNOT_SEND: '지금은 인증 메일을 보낼 수 없어요. 잠시 후 다시 시도해주세요.',
  TRADE_STATUS_NOT_ALLOWED: '지금 상태에서는 거래 상태를 바꿀 수 없어요.',
  TRADE_NOT_CANCELABLE: '이미 끝난 거래라 취소할 수 없어요.',
  PAYMENT_REFUNDABLE_AMOUNT_EXCEEDED: '환불 가능한 금액을 초과했어요.',
  PAYMENT_NOTHING_TO_REFUND: '환불할 금액이 남아 있지 않아요.',
  REVIEW_ANALYSIS_IN_PROGRESS: '리뷰를 분석하고 있어요. 잠시 후 다시 확인해주세요.',
  NOT_ENOUGH_REVIEWS_TO_ANALYZE: '분석할 리뷰가 아직 충분하지 않아요.',
  REVIEW_ANALYSIS_FAILED: '리뷰 분석에 실패했어요. 잠시 후 다시 시도해주세요.',
  REVIEW_ANALYSIS_NOT_CONFIGURED: '지금은 리뷰 분석을 사용할 수 없어요.',
  // 답글을 쓰는 사이 대상 댓글이 지워지면 나는 에러들이다. 화면은 목록을 다시 받아 맞춘다
  COMMENT_PARENT_NOT_FOUND: '답글을 달 댓글이 삭제되었어요.',
  COMMENT_PARENT_POST_MISMATCH: '이 글의 댓글에만 답글을 달 수 있어요.',
  COMMENT_REPLY_DEPTH_EXCEEDED: '답글을 달 수 없는 댓글이에요. 새로고침 후 다시 시도해주세요.',
  COMMENT_REPLY_TARGET_INVALID: '답글을 달 댓글이 삭제되었어요.',
}

export async function throwApiError(res: Response): Promise<never> {
  const err = await res.json().catch(() => null)
  const code: string | undefined = err?.error?.code
  throw new ApiError(
    (code ? MESSAGE_BY_CODE[code] : undefined) ?? err?.error?.message ?? '요청에 실패했습니다.',
    res.status,
    code,
    err?.error?.details ?? undefined
  )
}

export function isPayloadTooLarge(e: unknown): boolean {
  return e instanceof ApiError && e.status === 413
}
