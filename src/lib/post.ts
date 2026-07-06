const BASE = process.env.NEXT_PUBLIC_API_URL

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

import { throwApiError } from './apiError'

export interface Post {
  id: number
  title: string
  content: string
  fileUrls?: string[]
  username?: string
  viewCount?: number
  updatedAt?: string
}

export async function getPosts() {
  const res = await fetch(`${BASE}/api/post`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const raw = json?.data ?? json
  const list: Post[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
  return list
}

export async function getPost(postId: number) {
  const res = await fetch(`${BASE}/api/post/${postId}`)
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const post: Post = json?.data ?? json
  return { data: post }
}

export async function createPost(token: string, data: { title: string; content: string; fileUrls?: string[] }) {
  const res = await fetch(`${BASE}/api/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json() as Promise<{ data: Post }>
}

export async function updatePost(token: string, data: { id: number; title: string; content: string; fileUrls?: string[] }) {
  const res = await fetch(`${BASE}/api/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deletePost(token: string, postId: number) {
  const res = await fetch(`${BASE}/api/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function searchPosts(title: string, page = 0, size = 20) {
  const params = new URLSearchParams({ title, page: String(page), size: String(size) })
  const res = await fetch(`${BASE}/api/post/search?${params}`)
  if (!res.ok) await throwApiError(res)
  return res.json() as Promise<{ data: Post[] }>
}
