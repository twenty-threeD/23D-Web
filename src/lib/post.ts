import { throwApiError } from './apiError'
import { cached, invalidate, MINUTE } from './cache'
import { getJobCategories, ME_KEY } from './profile'

// 게시글 캐시 키 묶음. 글을 쓰거나 고치거나 지우면 목록·검색·상세를 한꺼번에 버린다
const POST_KEY = 'post:'
const FAVORITES_KEY = `${ME_KEY}favorites`
// 목록·상세는 다른 사람이 글을 올리면 바뀌므로 짧게만 들고 있는다. 페이지를 오갈 때 다시 받지 않는 정도면 충분하다
const LIST_TTL = MINUTE
const DETAIL_TTL = 30_000

function invalidatePosts() {
  invalidate(POST_KEY)
  // 지운 글이 찜 목록에 남아 있으면 안 된다
  invalidate(FAVORITES_KEY)
}

// 상세 캐시는 로그인 여부별로 나뉘어 있어 둘 다 버린다
function invalidatePostDetail(postId: number) {
  invalidate(`${POST_KEY}detail:auth:${postId}`)
  invalidate(`${POST_KEY}detail:anon:${postId}`)
}

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export interface PostMember {
  id: number
  username: string
  name: string
  imageUrl?: string | null
}

export interface PostCategory {
  id: number
  name: string
  parentId?: number | null
  parentName?: string | null
  fullName: string
}

export interface Post {
  id: number
  title: string
  content: string
  fileUrls?: string[]
  viewCount?: number
  updatedAt?: string
  member?: PostMember
  category?: PostCategory | null
}

// 이미지를 하나도 올리지 않은 서비스에 대신 보여줄 이미지.
// 빈 회색 칸만 두면 아직 불러오는 중인지 이미지가 없는 건지 구분이 안 된다
export const NO_POST_IMAGE = "/no-image.svg"

// 서비스 이미지는 헤더, 메인, 상세 이미지 순서로 저장된다.
// 헤더 이미지가 없는 기존 게시물은 첫 이미지를 메인 이미지로 사용한다.
export function getPostMainImage(fileUrls?: string[]) {
  return fileUrls?.[1] ?? fileUrls?.[0] ?? NO_POST_IMAGE
}

// 게시글 카테고리는 직군 카테고리로 통합되었다 (구 /api/post-category)
// 시안의 카테고리 표기(`이사 | 청소`)와 서버 카테고리명(`이사/청소`)이 달라 이름을 따로 둔다
export const CATEGORIES: { label: string; name: string }[] = [
  { label: "이사 | 청소", name: "이사/청소" },
  { label: "설치 | 수리", name: "설치/수리" },
  { label: "인테리어", name: "인테리어" },
  { label: "외주", name: "외주" },
  { label: "법률 | 금융", name: "법률/금융" },
  { label: "과외", name: "과외" },
  { label: "자동차", name: "자동차" },
  { label: "기타", name: "기타" },
];

// 프로필의 직종 목록과 같은 /api/job-category 라 같은 캐시를 쓴다
export function getPostCategories(): Promise<PostCategory[]> {
  return getJobCategories()
}

// 메인 카드 줄과 서비스 상세 하단 '비슷한 서비스' 가 같은 첫 페이지를 쓴다
export function getPosts(token?: string | null) {
  return cached(`${POST_KEY}list`, LIST_TTL, async () => {
    const res = await fetch(`/api/post?page=0&size=20`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const raw = json?.data ?? json
    const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
    return list
  })
}

// 서비스 상세·채팅방(이 방의 글 작성자 확인)·결제 화면이 같은 글을 본다.
// 서버의 조회수는 같은 회원이 하루 한 번만 세므로 여기서 덜 불러도 조회수는 그대로다
export function getPost(postId: number, token?: string | null) {
  // 익명 응답과 로그인 응답을 한 키에 두면, 비로그인으로 먼저 받은 결과가 캐시에 남아
  // 로그인 후에도 토큰 실린 요청이 나가지 않아 조회수가 안 오른다
  const scope = token ? 'auth' : 'anon'
  return cached(`${POST_KEY}detail:${scope}:${postId}`, DETAIL_TTL, async () => {
    const res = await fetch(`/api/post/${postId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const post: Post = json?.data ?? json
    return { data: post }
  })
}

export async function createPost(token: string, data: { title: string; content: string; fileUrls?: string[]; categoryId?: number }) {
  const res = await fetch(`/api/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  invalidatePosts()
  return res.json() as Promise<{ data: Post }>
}

export async function updatePost(token: string, data: { id: number; title: string; content: string; fileUrls?: string[]; categoryId?: number }) {
  const res = await fetch(`/api/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  invalidatePosts()
  return res.json()
}

export async function deletePost(token: string, postId: number) {
  const res = await fetch(`/api/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  invalidatePosts()
  return res.json()
}

// 검색 결과는 상세로 들어갔다가 뒤로 돌아올 때 다시 받지 않게 조건별로 잠깐 들고 있는다
export function searchPosts(title: string, page = 0, size = 20) {
  const params = new URLSearchParams({ title, page: String(page), size: String(size) })
  return cached(`${POST_KEY}search:${params}`, DETAIL_TTL, async () => {
    const res = await fetch(`/api/post/search?${params}`)
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const raw = json?.data ?? json
    const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
    return list
  })
}

// 작성자로 거르는 서버 API 가 없어서 전체 목록을 훑어 걸러낸다.
// 목록이 아주 많아지면 서버에 작성자 필터를 요청해야 한다.
const MY_POSTS_MAX_PAGES = 5
const MY_POSTS_PAGE_SIZE = 50

export async function getMyPosts(token: string, username: string) {
  const mine: Post[] = []

  for (let page = 0; page < MY_POSTS_MAX_PAGES; page++) {
    const params = new URLSearchParams({ page: String(page), size: String(MY_POSTS_PAGE_SIZE) })
    const res = await fetch(`/api/post?${params}`, { headers: authHeaders(token) })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const raw = json?.data ?? json
    const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])

    mine.push(...list.filter((p) => p.member?.username === username))

    if (Array.isArray(raw) || raw?.last !== false) break
  }

  return mine
}

export interface PagedPosts {
  posts: Post[]
  page: number
  totalPages: number
  totalElements: number
  last: boolean
}

// 검색 페이지용. 제목·카테고리 필터와 정렬을 서버에 맡기고 페이지 정보까지 함께 받는다.
export function searchPostsPaged(options: {
  title?: string
  categoryId?: number
  page?: number
  size?: number
  sort?: string
}): Promise<PagedPosts> {
  const { title = '', categoryId, page = 0, size = 20, sort } = options
  const params = new URLSearchParams({ title, page: String(page), size: String(size) })
  if (categoryId) params.set('categoryId', String(categoryId))
  if (sort) params.set('sort', sort)

  return cached(`${POST_KEY}search-paged:${params}`, DETAIL_TTL, async () => {
    const res = await fetch(`/api/post/search?${params}`)
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const raw = json?.data ?? json
    const posts: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])

    return {
      posts,
      page: raw?.number ?? page,
      totalPages: raw?.totalPages ?? 1,
      totalElements: raw?.totalElements ?? posts.length,
      // 배열만 오는 경우엔 더 불러올 페이지가 없는 것으로 본다
      last: raw?.last ?? true,
    }
  })
}

export interface FavoriteResult {
  postId: number
  favoriteCount: number
  message: string
}

export async function favoritePost(token: string, postId: number) {
  const res = await fetch(`/api/post/favorite?postId=${postId}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  // 찜 목록과 이 글의 찜 수가 바뀐다
  invalidate(FAVORITES_KEY)
  invalidatePostDetail(postId)
  const json = await res.json()
  return json.data as FavoriteResult
}

export async function unfavoritePost(token: string, postId: number) {
  const res = await fetch(`/api/post/favorite?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  // 찜 목록과 이 글의 찜 수가 바뀐다
  invalidate(FAVORITES_KEY)
  invalidatePostDetail(postId)
  const json = await res.json()
  return json.data as FavoriteResult
}

// 서비스 상세는 "이 글을 찜했는지" 하나를 보려고 찜 목록 전체를 받는다. 상세를 옮겨 다닐 때마다 다시 받지 않게 들고 있는다
export function getFavoritePosts(token: string, page = 0, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return cached(`${FAVORITES_KEY}:${params}`, LIST_TTL, async () => {
    const res = await fetch(`/api/post/favorite?${params}`, {
      headers: authHeaders(token),
    })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const raw = json?.data ?? json
    const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
    return list
  })
}
