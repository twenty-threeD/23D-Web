import { throwApiError } from './apiError'

/** 날짜 입력만 받는 계약서 화면의 값을 백엔드 LocalDateTime 형식으로 변환한다. */
export function toContractDateTime(date: string, endOfDay = false): string | null {
  if (!date) return null

  const time = endOfDay
    ? { hours: 23, minutes: 59, seconds: 59 }
    : { hours: 0, minutes: 0, seconds: 0 }

  return `${date}T${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export type ContractStatus = 'DRAFT' | 'SIGNED'

export interface Contract {
  id: number
  contractUrl: string
  // 갑(의뢰인, 대금 지급자)의 memberId
  clientId: number
  // 을(전문가, 대금 수령자)의 memberId
  professionalId: number
  price: number
  writerId: number
  status: ContractStatus
  signed: boolean
  clientSigned: boolean
  professionalSigned: boolean
  clientSignedAt?: string | null
  professionalSignedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

// 계약서 등록 (계약 당사자만 가능). contractUrl은 반드시 .pdf 로 끝나야 한다.
// 서명은 PDF 안에 이미 그려서 넣으므로 별도의 서명 API는 없다.
export async function createContract(
  token: string,
  data: {
    contractUrl: string
    clientId: number
    professionalId: number
    startedAt: string | null
    endedAt: string | null
    inspectionPeriod: number
    price: number
    servicesDescription: string
  }
) {
  const res = await fetch(`/api/contract`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data as Contract
}

// 계약서 조회. 결제 금액은 URL 쿼리가 아니라 반드시 이 응답의 price 를 써야 한다
// (prepare 가 계약 금액과 1원이라도 다르면 거부하고, 쿼리는 조작 가능하므로).
export async function getContract(token: string, contractId: number) {
  const res = await fetch(`/api/contract/${contractId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data as { id: number; price: number; contractUrl: string }
}

export async function getContractUrl(token: string, contractId: number) {
  const res = await fetch(`/api/contract/${contractId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data?.contractUrl ?? '') as string
}
