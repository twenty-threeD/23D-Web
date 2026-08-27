import { throwApiError } from './apiError'

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
  data: { contractUrl: string; clientId: number; professionalId: number; price: number }
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

// 계약서 조회. 응답에는 PDF 경로만 담겨온다 (금액 등은 내려오지 않는다).
export async function getContractUrl(token: string, contractId: number) {
  const res = await fetch(`/api/contract/${contractId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data?.contractUrl ?? '') as string
}
