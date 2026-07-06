function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ── 게시글 ──────────────────────────────────────────

export async function getPost(postId: number, token?: string | null) {
  const res = await fetch(`/api/community/post?postId=${postId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('게시글 조회 실패')
  return res.json()
}

export async function getPosts(token?: string | null) {
  const res = await fetch(`/api/community/post/search?keyword=`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('게시글 목록 조회 실패')
  return res.json()
}

export async function searchPosts(keyword: string, token?: string | null) {
  const res = await fetch(`/api/community/post/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('게시글 검색 실패')
  return res.json()
}

export async function createPost(
  token: string,
  data: { title: string; content: string; fileUrl?: string }
) {
  const res = await fetch(`/api/community/post`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('게시글 작성 실패')
  return res.json()
}

export async function updatePost(
  token: string,
  postId: number,
  data: { title?: string; content?: string; fileUrl?: string }
) {
  const res = await fetch(`/api/community/post`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, ...data }),
  })
  if (!res.ok) throw new Error('게시글 수정 실패')
  return res.json()
}

export async function deletePost(token: string, postId: number) {
  const res = await fetch(`/api/community/post`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ postId }),
  })
  if (!res.ok) throw new Error('게시글 삭제 실패')
  return res.json()
}

// ── 댓글 ──────────────────────────────────────────

export async function getComments(postId: number, token?: string | null, page = 0, size = 20) {
  const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) })
  const res = await fetch(`/api/community/comment?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('댓글 조회 실패')
  return res.json()
}

export async function createComment(token: string, postId: number, content: string) {
  const res = await fetch(`/api/community/comment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, content }),
  })
  if (!res.ok) throw new Error('댓글 작성 실패')
  return res.json()
}

export async function updateComment(token: string, commentId: number, content: string) {
  const res = await fetch(`/api/community/comment`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ commentId, content }),
  })
  if (!res.ok) throw new Error('댓글 수정 실패')
  return res.json()
}

export async function deleteComment(token: string, commentId: number) {
  const res = await fetch(`/api/community/comment`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ commentId }),
  })
  if (!res.ok) throw new Error('댓글 삭제 실패')
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
  if (!res.ok) throw new Error('좋아요 실패')
  return res.json()
}

export async function removeLike(token: string, postId: number) {
  const res = await fetch(`/api/community/like?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('좋아요 취소 실패')
  return res.json()
}
