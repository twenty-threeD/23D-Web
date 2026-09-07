import { throwApiError } from './apiError'

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ── 카테고리 ──────────────────────────────────────────

export const COMMUNITY_CATEGORIES = [
  { label: '이거 궁금해요', value: 'QUESTION' },
  { label: '전문가 추천', value: 'EXPERT_RECOMMEND' },
  { label: '견적 궁금해요', value: 'ESTIMATE' },
  { label: '동네 주민', value: 'NEIGHBORHOOD' },
] as const

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]['value']

export function isCommunityCategory(v: string | null | undefined): v is CommunityCategory {
  return !!v && COMMUNITY_CATEGORIES.some((c) => c.value === v)
}

export function categoryLabel(v: string | null | undefined) {
  return COMMUNITY_CATEGORIES.find((c) => c.value === v)?.label ?? ''
}

// ── 게시글 ──────────────────────────────────────────

export async function getPost(postId: number, token?: string | null) {
  const res = await fetch(`/api/community/post/${postId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function getPosts(token?: string | null) {
  const res = await fetch(`/api/community/post/search?keyword=`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function getPostsByCategory(category: CommunityCategory, token?: string | null) {
  const res = await fetch(`/api/community/post/category?category=${category}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function searchPosts(keyword: string, token?: string | null) {
  const res = await fetch(`/api/community/post/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function createPost(
  token: string,
  data: { title: string; content: string; fileUrl: string | null; category: CommunityCategory }
) {
  const res = await fetch(`/api/community/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function updatePost(
  token: string,
  postId: number,
  data: { title: string; content: string; fileUrl: string | null; category: CommunityCategory }
) {
  const res = await fetch(`/api/community/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, ...data }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deletePost(token: string, postId: number) {
  const res = await fetch(`/api/community/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// ── 댓글 ──────────────────────────────────────────

export async function getComments(postId: number, token?: string | null, page = 0, size = 20) {
  const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) })
  const res = await fetch(`/api/community/comment?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function createComment(token: string, postId: number, content: string) {
  const res = await fetch(`/api/community/comment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, content }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function updateComment(token: string, commentId: number, content: string) {
  const res = await fetch(`/api/community/comment`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ commentId, content }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deleteComment(token: string, commentId: number) {
  const res = await fetch(`/api/community/comment?commentId=${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// ── 좋아요 ──────────────────────────────────────────

export async function addLike(token: string, postId: number) {
  const res = await fetch(`/api/community/like`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId }),
  })
  if (res.status === 400) return { alreadyLiked: true }
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function removeLike(token: string, postId: number) {
  const res = await fetch(`/api/community/like?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}
