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
