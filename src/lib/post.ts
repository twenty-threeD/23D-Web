import { throwApiError } from './apiError'

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

// 서비스 이미지는 헤더, 메인, 상세 이미지 순서로 저장된다.
// 헤더 이미지가 없는 기존 게시물은 첫 이미지를 메인 이미지로 사용한다.
export function getPostMainImage(fileUrls?: string[]) {
  return fileUrls?.[1] ?? fileUrls?.[0]
}

// 게시글 카테고리는 직군 카테고리로 통합되었다 (구 /api/post-category)
export async function getPostCategories() {
  const res = await fetch(`/api/job-category`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? []) as PostCategory[]
}

export async function getPosts(token?: string | null) {
  const res = await fetch(`/api/post?page=0&size=20`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const raw = json?.data ?? json
  const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
  return list
}

export async function getPost(postId: number, token?: string | null) {
  const res = await fetch(`/api/post/${postId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const post: Post = json?.data ?? json
  return { data: post }
}

export async function createPost(token: string, data: { title: string; content: string; fileUrls?: string[]; categoryId?: number }) {
  const res = await fetch(`/api/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json() as Promise<{ data: Post }>
}

export async function updatePost(token: string, data: { id: number; title: string; content: string; fileUrls?: string[]; categoryId?: number }) {
  const res = await fetch(`/api/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deletePost(token: string, postId: number) {
  const res = await fetch(`/api/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function searchPosts(title: string, page = 0, size = 20) {
  const params = new URLSearchParams({ title, page: String(page), size: String(size) })
  const res = await fetch(`/api/post/search?${params}`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const raw = json?.data ?? json
  const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
  return list
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
export async function searchPostsPaged(options: {
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
  const json = await res.json()
  return json.data as FavoriteResult
}

export async function unfavoritePost(token: string, postId: number) {
  const res = await fetch(`/api/post/favorite?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return json.data as FavoriteResult
}

export async function getFavoritePosts(token: string, page = 0, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const res = await fetch(`/api/post/favorite?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const raw = json?.data ?? json
  const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
  return list
}
