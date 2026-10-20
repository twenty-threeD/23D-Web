import { throwApiError } from './apiError'
import { cached, invalidate, MINUTE } from './cache'
import type { Post } from './post'

// 내 정보 캐시 키 묶음. 내 정보를 바꾸는 요청 뒤에는 invalidateMe() 로 함께 지운다
export const ME_KEY = 'me:'

export function invalidateMe() {
  invalidate(ME_KEY)
}

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
  /** 비밀번호 설정 여부. 소셜 가입 후 아직 설정하지 않았으면 false */
  hasPassword?: boolean
}

// 서버 알림은 이 기능 배포 이후 가입자에게만 가서, 기존 소셜 회원은 이 값으로 화면 배너를 띄워 안내한다
export function needsPasswordSetup(profile: Pick<Profile, 'hasPassword'> | null | undefined) {
  return profile?.hasPassword === false
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

// 헤더·채팅(내 회원 id·전화 인증 여부)·결제·프로필 화면이 같은 값을 각자 받아 와서 한 번 받은 걸 같이 쓴다.
// 채팅은 방을 바꿀 때마다 페이지가 새로 떠서 캐시가 없으면 방을 옮길 때마다 다시 받는다
export function getMyProfile(token: string) {
  return cached(`${ME_KEY}profile`, MINUTE, async () => {
    const res = await fetch(`/api/profile`, { headers: authHeaders(token) })
    if (!res.ok) await throwApiError(res)
    return res.json() as Promise<{ data: Profile }>
  })
}

export async function updateMyProfile(
  token: string,
  data: {
    username?: string
    // 생략하거나 비우면 서버가 기본 이미지로 초기화한다. 이름만 바꿀 때도 현재 이미지를 같이 보내야 한다.
    // /files/<파일명> 형식만 받으므로 toUploadPath 를 거친 값을 넣는다
    imageUrl?: string | null
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
  invalidateMe()
  return res.json() as Promise<{ data: { message: string } }>
}

// 운영 중에 거의 바뀌지 않는 값이라 길게 들고 있는다. 메인·검색·더보기·서비스 등록·프로필이 같이 쓴다
const STATIC_TTL = 30 * MINUTE

export function getJobCategories() {
  return cached('static:job-category', STATIC_TTL, async () => {
    const res = await fetch(`/api/job-category`)
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    return (json.data ?? []) as JobCategory[]
  })
}

// 로컬(localhost)에는 accessToken 쿠키가 없어 쿠키 인증에 기대면 401 이 난다. 다른 API 처럼 헤더로 보낸다
export function getSidoList(token: string) {
  return cached('static:sido', STATIC_TTL, async () => {
    const res = await fetch(`/api/location/sido`, { headers: authHeaders(token) })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    return (json.data ?? []) as Sido[]
  })
}

// 프로필 수정에서 시/도를 바꿨다가 되돌릴 때마다 다시 받지 않게 시/도별로 들고 있는다
export function getSigunguList(token: string, ctprvnCd: string) {
  return cached(`static:sigungu:${ctprvnCd}`, STATIC_TTL, async () => {
    const params = new URLSearchParams({ ctprvnCd })
    const res = await fetch(`/api/location/sigungu?${params}`, { headers: authHeaders(token) })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    return (json.data ?? []) as Sigungu[]
  })
}
