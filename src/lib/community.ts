import { throwApiError } from './apiError'
import { cached, invalidate, MINUTE } from './cache'
import { ME_KEY } from './profile'

// 커뮤니티 목록 캐시 키 묶음. 글·댓글·좋아요가 바뀌면 invalidateCommunity() 로 지운다
const COMMUNITY_KEY = 'community:'
// '전체'·'동네 주민' 탭은 지역 필터 때문에 글 전체를 마지막 페이지까지 받는다.
// 글을 보고 목록으로 돌아올 때마다 처음부터 다시 받지 않게 잠깐 들고 있는다
const LIST_TTL = 30_000

function invalidateCommunity() {
  invalidate(COMMUNITY_KEY)
}

// 목록 응답을 url 별로 들고 있는다. 상세(조회수)와 댓글은 늘 새로 받는다
function cachedList(url: string, token?: string | null) {
  return cached(`${COMMUNITY_KEY}${url}`, LIST_TTL, async () => {
    const res = await fetch(url, { headers: authHeaders(token) })
    if (!res.ok) await throwApiError(res)
    return res.json()
  })
}

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

// ── 동네 주민 지역 ──────────────────────────────────────────
// 동네 주민 글은 같은 시·도(대구광역시, 인천광역시 …) 회원끼리만 보여야 한다.
// 커뮤니티 글 응답에 작성자 지역이 없어서, 작성 시 본문 맨 앞에 [지역:시도코드] 를 붙여
// 저장하고 목록·상세에서 내 시도코드(ctprvnCd)와 비교한다.
// 서버 필터가 아니므로 API 를 직접 호출하면 우회된다. 백엔드가 글에 지역을 담아 주면 걷어낸다.

const REGION_TAG = /^\[지역:(\d{2})\]\n?/

export function parseRegion(content: string | null | undefined) {
  const text = content ?? ''
  const match = text.match(REGION_TAG)
  return { ctprvnCd: match?.[1] ?? null, body: match ? text.slice(match[0].length) : text }
}

export function tagRegion(content: string, ctprvnCd: string) {
  return `[지역:${ctprvnCd}]\n${parseRegion(content).body}`
}

export interface MemberLocation {
  sigCd: string
  ctprvnCd: string
  locationName: string
}

// 지역 미설정 회원은 404(LOCATION_NOT_SET)가 오므로 에러 대신 null 로 돌려준다
// 커뮤니티 목록·글 상세가 화면마다 다시 묻던 값이다. 지역은 프로필 수정으로만 바뀌고, 그때 invalidateMe() 로 지워진다.
// 실패는 캐시하지 않고(일시 오류로 한동안 동네 글이 안 보이는 일을 막는다) 호출부에는 지금처럼 null 로 돌려준다
export function getMyLocation(token: string): Promise<MemberLocation | null> {
  return cached(`${ME_KEY}location`, MINUTE, async () => {
    const res = await fetch(`/api/member/location`, { headers: authHeaders(token) })
    if (!res.ok) throw new Error('location')
    const json = await res.json()
    return (json.data ?? null) as MemberLocation | null
  }).catch(() => null)
}

interface RegionFilterable {
  username: string
  category?: string
  content?: string | null
}

// 본인 글은 지역을 옮긴 뒤에도 수정·삭제할 수 있어야 하므로 항상 보인다
export function canViewPost(post: RegionFilterable, myCtprvnCd: string | null, myUsername: string | null) {
  if (post.category !== 'NEIGHBORHOOD') return true
  if (myUsername && post.username === myUsername) return true
  const { ctprvnCd } = parseRegion(post.content)
  return !!myCtprvnCd && ctprvnCd === myCtprvnCd
}

// 볼 수 없는 동네 주민 글을 빼고, 남은 글의 본문에서 지역 태그를 떼어낸다
export function filterByRegion<T extends RegionFilterable>(
  posts: T[],
  myCtprvnCd: string | null,
  myUsername: string | null,
): T[] {
  return posts
    .filter((p) => canViewPost(p, myCtprvnCd, myUsername))
    .map((p) => ({ ...p, content: parseRegion(p.content).body }))
}

// ── 페이지 ──────────────────────────────────────────
// 목록 API 는 서버 페이징이지만 작성자 지역을 모르고 자른다.
// 동네 주민 글이 섞이는 목록(전체·검색·동네 주민)은 서버 페이지를 그대로 쓰면 걸러진 만큼
// 페이지가 비므로, 끝까지 받아 거른 뒤 프론트에서 COMMUNITY_PAGE_SIZE 로 다시 자른다.

export const COMMUNITY_PAGE_SIZE = 10

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export function needsRegionFilter(category: CommunityCategory | null, keyword: string) {
  return !!keyword || category === null || category === 'NEIGHBORHOOD'
}

// 서버 최대 size 를 넘지 않도록 100개씩 끊어 마지막 페이지까지 받는다
export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<{ data?: PageResponse<T> | null }>,
): Promise<T[]> {
  const all: T[] = []
  for (let page = 0; ; page++) {
    const res = await fetchPage(page, 100)
    const data = res.data
    if (!data) break
    all.push(...data.content)
    if (data.last || data.content.length === 0) break
  }
  return all
}

export function sortByLatest<T extends { updatedAt: string }>(posts: T[]) {
  return [...posts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function communityListHref(category: CommunityCategory | null, page: number) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/community?${qs}` : '/community'
}

// ── 게시글 ──────────────────────────────────────────

export async function getPost(postId: number, token?: string | null) {
  const res = await fetch(`/api/community/post/${postId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

function pageParams(page: number, size: number) {
  return `page=${page}&size=${size}`
}

export function getPosts(token?: string | null, page = 0, size = COMMUNITY_PAGE_SIZE) {
  return cachedList(`/api/community/post?${pageParams(page, size)}`, token)
}

export function getPostsByCategory(
  category: CommunityCategory,
  token?: string | null,
  page = 0,
  size = COMMUNITY_PAGE_SIZE,
) {
  return cachedList(`/api/community/post/category?category=${category}&${pageParams(page, size)}`, token)
}

export function searchPosts(keyword: string, token?: string | null, page = 0, size = COMMUNITY_PAGE_SIZE) {
  return cachedList(`/api/community/post/search?keyword=${encodeURIComponent(keyword)}&${pageParams(page, size)}`, token)
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
  invalidateCommunity()
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
  invalidateCommunity()
  return res.json()
}

export async function deletePost(token: string, postId: number) {
  const res = await fetch(`/api/community/post?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  invalidateCommunity()
  return res.json()
}

// ── 댓글 ──────────────────────────────────────────

export interface CommunityComment {
  id: number
  postId: number
  // 답글이면 원댓글 id. 답글의 답글은 서버가 받지 않아 항상 원댓글을 가리킨다
  parentId: number | null
  username: string
  imageUrl: string | null
  content: string
  isEdited: boolean
  // 답글이 남아 있는 원댓글을 지우면 자리만 남는다. 이때 content·username 은 "삭제된 댓글입니다" 로 온다
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  // 최상위 댓글에만 채워진다
  replies: CommunityComment[]
}

export interface CommentPage {
  // 최상위 댓글만 들어 있다. totalElements 도 답글을 세지 않으므로 댓글 수 표시는 게시글의 commentCount 를 쓴다
  content: CommunityComment[]
  page: number
  totalElements: number
  last: boolean
}

export async function getComments(postId: number, token?: string | null, page = 0, size = 20): Promise<CommentPage> {
  const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) })
  const res = await fetch(`/api/community/comment?${params}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const raw = json?.data ?? json
  return {
    content: raw?.content ?? [],
    page: raw?.page ?? page,
    totalElements: raw?.totalElements ?? 0,
    last: raw?.last ?? true,
  }
}

// parentId 에는 답글에 답글을 달 때도 원댓글 id 를 넣어야 한다. 답글 id 를 넣으면 서버가 400 을 낸다
export async function createComment(token: string, postId: number, content: string, parentId?: number) {
  const res = await fetch(`/api/community/comment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(parentId ? { postId, content, parentId } : { postId, content }),
  })
  if (!res.ok) await throwApiError(res)
  invalidateCommunity()
  return res.json()
}

export async function updateComment(token: string, commentId: number, content: string) {
  const res = await fetch(`/api/community/comment`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ commentId, content }),
  })
  if (!res.ok) await throwApiError(res)
  invalidateCommunity()
  return res.json()
}

export async function deleteComment(token: string, commentId: number) {
  const res = await fetch(`/api/community/comment?commentId=${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  invalidateCommunity()
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
  invalidateCommunity()
  return res.json()
}

export async function removeLike(token: string, postId: number) {
  const res = await fetch(`/api/community/like?postId=${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  invalidateCommunity()
  return res.json()
}
