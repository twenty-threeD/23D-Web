import { throwApiError } from './apiError'
import type { Post } from './post'

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export interface Profile {
  memberId?: number
  username: string
  email?: string | null
  phone?: string | null
  phoneVerified?: boolean
  /** 본인이 등록한 게시글 */
  posts?: Post[]
  imageUrl?: string | null
  sigCd?: string | null
  locationName?: string | null
  movableDistance?: string | null
  movableDistanceLabel?: string | null
  shortDescription?: string | null
  jobCategoryId?: number | null
  jobCategoryName?: string | null
  updatedAt?: string | null
}

export interface JobCategory {
  id: number
  name: string
  parentId?: number | null
  parentName?: string | null
  fullName: string
}

export interface Sido {
  ctprvnCd: string
  korName?: string | null
  engName?: string | null
}

export interface Sigungu {
  sigCd: string
  korName?: string | null
  engName?: string | null
}

export async function getMyProfile(token: string) {
  const res = await fetch(`/api/profile`, { headers: authHeaders(token) })
  if (!res.ok) await throwApiError(res)
  return res.json() as Promise<{ data: Profile }>
}

export async function updateMyProfile(
  token: string,
  data: {
    username?: string
    imageUrl?: string
    sigCd?: string
    movableDistance?: 'TEN_KM' | 'TWENTY_FIVE_KM' | 'FIFTY_KM' | 'OVER_HUNDRED_KM'
    shortDescription?: string
    jobCategoryId?: number
  }
) {
  const res = await fetch(`/api/profile`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json() as Promise<{ data: { message: string } }>
}

export async function getJobCategories() {
  const res = await fetch(`/api/job-category`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? []) as JobCategory[]
}

export async function getSidoList() {
  const res = await fetch(`/api/location/sido`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? []) as Sido[]
}

export async function getSigunguList(ctprvnCd: string) {
  const params = new URLSearchParams({ ctprvnCd })
  const res = await fetch(`/api/location/sigungu?${params}`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? []) as Sigungu[]
}
