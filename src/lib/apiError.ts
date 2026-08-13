export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function throwApiError(res: Response): Promise<never> {
  const err = await res.json().catch(() => null)
  throw new ApiError(err?.error?.message ?? '요청에 실패했습니다.', res.status)
}

export function isPayloadTooLarge(e: unknown): boolean {
  return e instanceof ApiError && e.status === 413
}
