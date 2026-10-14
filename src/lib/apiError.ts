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
