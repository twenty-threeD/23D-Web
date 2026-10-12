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

export async function throwApiError(res: Response): Promise<never> {
  const err = await res.json().catch(() => null)
  throw new ApiError(
    err?.error?.message ?? '요청에 실패했습니다.',
    res.status,
    err?.error?.code,
    err?.error?.details ?? undefined
  )
}

export function isPayloadTooLarge(e: unknown): boolean {
  return e instanceof ApiError && e.status === 413
}
