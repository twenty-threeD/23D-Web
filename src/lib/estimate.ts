import { throwApiError } from './apiError'

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export interface Estimate {
  id: number
  clientId: number
  professionalId: number
  url: string
  totalPay: number
  paid: boolean
  createdAt?: string
  updatedAt?: string
}

// 내 견적서 목록
export async function getEstimates(token: string) {
  const res = await fetch(`/api/estimate`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? []) as Estimate[]
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
