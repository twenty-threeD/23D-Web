import { throwApiError } from './apiError'

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export type EstimateStatus = 'PROPOSED' | 'PAID'

export interface Estimate {
  id: number
  postId: number
  clientId: number
  professionalId: number
  url: string
  totalPay: number
  status: EstimateStatus
  /** @deprecated status 파생값. 결제 전/후 판단은 status 를 쓴다. */
  paid: boolean
  createdAt?: string
  updatedAt?: string
}

// 내 견적서 목록 (의뢰인/전문가로 참여한 견적서를 모두 반환한다)
// postId 를 주면 해당 게시글 건만 조회한다.
export async function getEstimates(token: string, postId?: number) {
  const query = postId ? `?postId=${postId}` : ''
  const res = await fetch(`/api/estimate${query}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? []) as Estimate[]
}

// 견적서 발행 (전문가 전용 — USER 계정으로 호출하면 403)
export async function createEstimate(
  token: string,
  data: { postId: number; clientId: number; url: string; totalPay: number }
) {
  const res = await fetch(`/api/estimate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data as Estimate
}

// 견적서 수정 (제안한 전문가만 가능)
export async function updateEstimate(
  token: string,
  estimateId: number,
  data: { url: string; totalPay: number }
) {
  const res = await fetch(`/api/estimate/${estimateId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data as Estimate
}

// 견적서 철회 (제안한 전문가만 가능)
export async function deleteEstimate(token: string, estimateId: number) {
  const res = await fetch(`/api/estimate/${estimateId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// 견적서 단건 조회
export async function getEstimate(token: string, estimateId: number) {
  const res = await fetch(`/api/estimate/${estimateId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data as Estimate
}
