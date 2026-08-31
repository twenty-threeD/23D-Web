export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function throwApiError(res: Response): Promise<never> {
  const err = await res.json().catch(() => null)
  throw new ApiError(
    err?.error?.message ?? '요청에 실패했습니다.',
    res.status,
    err?.error?.code
  )
}

export function isPayloadTooLarge(e: unknown): boolean {
  return e instanceof ApiError && e.status === 413
}
