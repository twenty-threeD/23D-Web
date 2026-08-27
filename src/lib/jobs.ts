import { serializeJobContent, type JobPostContent } from '@/src/types/jobPost'

// 구인구직 API는 아직 준비 중이다. 엔드포인트 경로만 잡아두었고, 스펙이
// 확정되면 이 파일만 고치면 되도록 화면에서는 구조화된 값으로만 주고받는다.

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ── 게시글 ──────────────────────────────────────────

export async function getJobPost(postId: number, token?: string | null) {
  const res = await fetch(`/api/jobs/post?postId=${postId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('구인구직 글 조회 실패')
  return res.json()
}

export async function getJobPosts(token?: string | null) {
  const res = await fetch(`/api/jobs/post/search?keyword=`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('구인구직 목록 조회 실패')
  return res.json()
}

export async function searchJobPosts(keyword: string, token?: string | null) {
  const res = await fetch(`/api/jobs/post/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('구인구직 검색 실패')
  return res.json()
}

export async function createJobPost(
  token: string,
  data: { title: string; job: JobPostContent; fileUrls?: string[] }
) {
  const res = await fetch(`/api/jobs/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      title: data.title,
      content: serializeJobContent(data.job),
      categoryId: data.job.categoryId,
      fileUrls: data.fileUrls,
    }),
  })
  if (!res.ok) throw new Error('구인구직 글 작성 실패')
  return res.json()
}

export async function updateJobPost(
  token: string,
  postId: number,
  data: { title: string; job: JobPostContent; fileUrls?: string[] }
) {
  const res = await fetch(`/api/jobs/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      id: postId,
      title: data.title,
      content: serializeJobContent(data.job),
      categoryId: data.job.categoryId,
      fileUrls: data.fileUrls,
    }),
  })
  if (!res.ok) throw new Error('구인구직 글 수정 실패')
  return res.json()
}

export async function deleteJobPost(token: string, postId: number) {
  const res = await fetch(`/api/jobs/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('구인구직 글 삭제 실패')
  return res.json()
}

// ── 댓글 ──────────────────────────────────────────

export async function getJobComments(postId: number, token?: string | null, page = 0, size = 20) {
  const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) })
  const res = await fetch(`/api/jobs/comment?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('댓글 조회 실패')
  return res.json()
}

export async function createJobComment(token: string, postId: number, content: string) {
  const res = await fetch(`/api/jobs/comment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, content }),
  })
  if (!res.ok) throw new Error('댓글 작성 실패')
  return res.json()
}

export async function updateJobComment(token: string, commentId: number, content: string) {
  const res = await fetch(`/api/jobs/comment`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ commentId, content }),
  })
  if (!res.ok) throw new Error('댓글 수정 실패')
  return res.json()
}

export async function deleteJobComment(token: string, commentId: number) {
  const res = await fetch(`/api/jobs/comment?commentId=${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('댓글 삭제 실패')
  return res.json()
}

// ── 좋아요 ──────────────────────────────────────────

export async function addJobLike(token: string, postId: number) {
  const res = await fetch(`/api/jobs/like`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId }),
  })
  if (res.status === 400) return { alreadyLiked: true }
  if (!res.ok) throw new Error('좋아요 실패')
  return res.json()
}

export async function removeJobLike(token: string, postId: number) {
  const res = await fetch(`/api/jobs/like?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('좋아요 취소 실패')
  return res.json()
}
