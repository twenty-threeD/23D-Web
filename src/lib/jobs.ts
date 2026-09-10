import { throwApiError } from './apiError'
import {
  serializeJobContent,
  type JobPostContent,
  type JobPostType,
} from '@/src/types/jobPost'

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ── 응답 타입 ──────────────────────────────────────────

export interface JobPostListItem {
  id: number
  username: string
  title: string
  content: string
  /** 대표 이미지 한 장. 나머지 이미지는 본문 마크다운에 들어간다. */
  fileUrl?: string | null
  postType?: JobPostType
  updatedAt: string
}

export interface JobPost extends JobPostListItem {
  viewCount: number
  likeCount: number
  commentCount: number
  edited: boolean
  isLiked?: boolean
}

export interface JobComment {
  id: number
  username: string
  content: string
  updatedAt: string
  edited?: boolean
}

export interface Paged<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// 서버는 목록·댓글을 { data: { content, ... } } 페이지 객체로 내려준다.
// 배열 분기를 남겨둔 것은 서버와 프론트 배포 시점이 어긋나도 목록이
// 통째로 비지 않게 하기 위한 것이다. 배포가 정리되면 지워도 된다.
interface RawPage {
  content?: unknown
  number?: number
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}

function toPaged<T>(raw: unknown, page: number, size: number): Paged<T> {
  if (Array.isArray(raw)) {
    return { content: raw as T[], page, size, totalElements: raw.length, totalPages: 1, last: true }
  }
  const p = (raw ?? {}) as RawPage
  const content = (Array.isArray(p.content) ? p.content : []) as T[]
  return {
    content,
    page: p.number ?? p.page ?? page,
    size: p.size ?? size,
    totalElements: p.totalElements ?? content.length,
    totalPages: p.totalPages ?? 1,
    last: p.last ?? true,
  }
}

async function readData(res: Response): Promise<unknown> {
  const json = await res.json().catch(() => null)
  return (json as { data?: unknown } | null)?.data ?? json
}

// ── 게시글 ──────────────────────────────────────────

export async function getJobPost(postId: number, token?: string | null): Promise<JobPost> {
  const res = await fetch(`/api/jobs/post?postId=${postId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return (await readData(res)) as JobPost
}

export interface JobPostQuery {
  keyword?: string
  postType?: JobPostType
  page?: number
  size?: number
}

export async function searchJobPosts(
  options: JobPostQuery = {},
  token?: string | null
): Promise<Paged<JobPostListItem>> {
  const { keyword = '', postType, page = 0, size = 20 } = options
  const params = new URLSearchParams({ keyword, page: String(page), size: String(size) })
  if (postType) params.set('postType', postType)

  const res = await fetch(`/api/jobs/post/search?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return toPaged<JobPostListItem>(await readData(res), page, size)
}

export interface JobPostPayload {
  title: string
  job: JobPostContent
  postType: JobPostType
  fileUrl?: string | null
}

function toPostBody(data: JobPostPayload) {
  return {
    title: data.title,
    content: serializeJobContent(data.job),
    categoryId: data.job.categoryId,
    postType: data.postType,
    fileUrl: data.fileUrl ?? null,
  }
}

export async function createJobPost(token: string, data: JobPostPayload): Promise<{ postId?: number }> {
  const res = await fetch(`/api/jobs/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(toPostBody(data)),
  })
  if (!res.ok) await throwApiError(res)
  const created = (await readData(res)) as { postId?: number; id?: number } | null
  return { postId: created?.postId ?? created?.id }
}

export async function updateJobPost(token: string, postId: number, data: JobPostPayload) {
  const res = await fetch(`/api/jobs/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ id: postId, ...toPostBody(data) }),
  })
  if (!res.ok) await throwApiError(res)
  return readData(res)
}

export async function deleteJobPost(token: string, postId: number) {
  const res = await fetch(`/api/jobs/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return readData(res)
}

// ── 댓글 ──────────────────────────────────────────

export async function getJobComments(
  postId: number,
  token?: string | null,
  page = 0,
  size = 20
): Promise<Paged<JobComment>> {
  const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) })
  const res = await fetch(`/api/jobs/comment?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return toPaged<JobComment>(await readData(res), page, size)
}

export async function createJobComment(token: string, postId: number, content: string) {
  const res = await fetch(`/api/jobs/comment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, content }),
  })
  if (!res.ok) await throwApiError(res)
  return readData(res)
}

export async function updateJobComment(token: string, commentId: number, content: string) {
  const res = await fetch(`/api/jobs/comment`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ commentId, content }),
  })
  if (!res.ok) await throwApiError(res)
  return readData(res)
}

export async function deleteJobComment(token: string, commentId: number) {
  const res = await fetch(`/api/jobs/comment?commentId=${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return readData(res)
}

// ── 좋아요 ──────────────────────────────────────────

export interface JobLikeResult {
  alreadyLiked?: boolean
  likeCount?: number
}

export async function addJobLike(token: string, postId: number): Promise<JobLikeResult> {
  const res = await fetch(`/api/jobs/like`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId }),
  })
  // 서버는 이미 좋아요를 누른 경우를 400 으로 알린다.
  if (res.status === 400) return { alreadyLiked: true }
  if (!res.ok) await throwApiError(res)
  return ((await readData(res)) ?? {}) as JobLikeResult
}

export async function removeJobLike(token: string, postId: number): Promise<JobLikeResult> {
  const res = await fetch(`/api/jobs/like?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return ((await readData(res)) ?? {}) as JobLikeResult
}
