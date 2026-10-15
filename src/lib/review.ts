import { throwApiError } from './apiError'
import { cached, invalidate, MINUTE } from './cache'
import { ME_KEY } from './profile'

const REVIEW_KEY = 'review:'
const REVIEWABLE_KEY = `${ME_KEY}reviewable:`
const REVIEW_TTL = 30_000

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export interface ReviewAuthor {
  username?: string | null
  name?: string | null
  imageUrl?: string | null
}

export interface Review {
  id: number | string
  rating: number
  content: string
  createdAt?: string | null
  updatedAt?: string | null
  workDays?: number | null
  priceRange?: string | null
  categoryName?: string | null
  author?: ReviewAuthor | null
}

type ReviewResponse = { data?: unknown }

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function asNumber(value: unknown, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : fallback
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function normalizeReview(value: unknown, index = 0): Review {
  const raw = asRecord(value)
  const author = asRecord(raw.author ?? raw.reviewer ?? raw.member ?? raw.user)
  const authorName = asString(author.name ?? raw.authorName ?? raw.reviewerName ?? raw.memberName)
  const username = asString(author.username ?? raw.username ?? raw.reviewerUsername)
  const imageUrl = asString(author.imageUrl ?? author.profileImage ?? raw.profileImage ?? raw.imageUrl)

  return {
    id: (typeof raw.id === 'string' || typeof raw.id === 'number') ? raw.id : `review-${index}`,
    rating: Math.min(5, Math.max(0, asNumber(raw.rating ?? raw.score))),
    content: asString(raw.content ?? raw.comment ?? raw.text),
    createdAt: asString(raw.createdAt ?? raw.writtenAt ?? raw.date) || null,
    updatedAt: asString(raw.updatedAt) || null,
    workDays: raw.workDays == null ? null : asNumber(raw.workDays),
    priceRange: asString(raw.priceRange ?? raw.orderAmount) || null,
    categoryName: asString(raw.categoryName ?? raw.serviceName) || null,
    author: authorName || username || imageUrl
      ? { name: authorName || null, username: username || null, imageUrl: imageUrl || null }
      : null,
  }
}

// offset: 여러 페이지를 이어 받을 때 id 없는 리뷰의 임시 키가 페이지마다 겹치지 않게 한다
function getReviewList(json: ReviewResponse | unknown, offset = 0) {
  const root = asRecord(json)
  const data = root.data ?? json
  const dataRecord = asRecord(data)
  const list = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord.content)
      ? dataRecord.content
      : Array.isArray(dataRecord.reviews)
        ? dataRecord.reviews
        : []

  return list.map((review, index) => normalizeReview(review, offset + index))
}

const REVIEW_PAGE_SIZE = 50

// 글의 리뷰를 전부 받는다. 서버에 글 단위 평점 요약이 없어 화면이 평균·개수를 직접 계산하는데,
// 첫 페이지만 받으면 리뷰가 많은 글의 평점·개수가 틀려서 마지막 페이지까지 이어 받는다
export function getReviews(postId: number, token?: string | null) {
  return cached(`${REVIEW_KEY}list:${postId}`, REVIEW_TTL, async () => {
    const all: Review[] = []
    for (let page = 0; ; page++) {
      const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(REVIEW_PAGE_SIZE) })
      const res = await fetch(`/api/post/review?${params}`, { headers: authHeaders(token) })
      if (!res.ok) await throwApiError(res)
      const json = await res.json()
      const list = getReviewList(json, all.length)
      all.push(...list)
      const totalPages = asNumber(asRecord(asRecord(json).data).totalPages, 1)
      if (list.length < REVIEW_PAGE_SIZE || page + 1 >= totalPages) break
    }
    return all
  })
}

// 후기는 게시글이 아니라 계약 단위로 남는다. 서버가 계약에서 글·작성자·대상자를 찾아 채우므로
// 게시글 id 는 보내지 않는다. 의뢰인이 아니거나 결제가 끝나지 않은 계약이면 403 으로 막힌다
export async function createReview(
  token: string,
  data: { contractId: number; rating: number; content: string }
) {
  const res = await fetch('/api/post/review', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  // 리뷰 목록·요약이 바뀌고, 방금 쓴 계약은 더 이상 리뷰를 쓸 수 없다
  invalidate(REVIEW_KEY)
  invalidate(REVIEWABLE_KEY)

  const json = await res.json()
  const response = asRecord(json)
  return response.data ? normalizeReview(response.data) : null
}

export interface ReviewableContract {
  contractId: number
  professionalId: number | null
  professionalName: string
  createdAt: string | null
}

// 이 글에서 내가 지금 후기를 남길 수 있는 계약 목록(최신순). 없으면 빈 배열이다.
// 서버가 후기 등록과 같은 조건(내가 의뢰인 · 의뢰인 결제가 체인 기록까지 완료 · 아직 후기 없음)으로 거른 결과라,
// 여기 나온 계약은 등록 검증을 통과한다. 한 글에서 여러 전문가와 계약할 수 있어 배열로 온다
export function getReviewableContracts(token: string, postId: number) {
  const params = new URLSearchParams({ postId: String(postId) })
  return cached(`${REVIEWABLE_KEY}${postId}`, REVIEW_TTL, async () => {
    const res = await fetch(`/api/post/review/reviewable?${params}`, { headers: authHeaders(token) })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    return (Array.isArray(json?.data) ? json.data : []) as ReviewableContract[]
  })
}

export interface ReviewSummary {
  memberId: number
  reviewCount: number
  averageRating: number
}

// 전문가(회원) 한 명이 받은 리뷰의 평점 요약. 게시글 단위가 아니라 회원 단위라 memberId 로 조회한다
export async function getReviewSummary(memberId: number, token?: string | null) {
  const res = await fetch(`/api/post/review/summary?memberId=${memberId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  return (json.data ?? null) as ReviewSummary | null
}

export interface ReviewAnalysis {
  summary: string
  keywords: string[]
  analyzedReviewCount: number
  updatedAt: string | null
}

// 게시글 하나에 달린 리뷰를 AI 가 요약한 결과. 서버가 전문가 단위 총평을 없애고 글 단위로 바꿔서 postId 로 조회한다.
// 남의 분석도 볼 수 있지만 로그인은 필요해서 토큰 없이 부르면 401 이다.
// 분석 중(409)·리뷰 부족(400)·분석 실패(502)·미설정(503)은 ApiError 의 code 로 구분한다
// AI 요약은 서버가 리뷰가 쌓일 때만 다시 만든다. 같은 글을 다시 열어도 다시 받지 않게 길게 들고 있는다.
// 분석 중(REVIEW_ANALYSIS_IN_PROGRESS) 같은 실패 응답은 캐시하지 않아 다음에 다시 확인한다.
// 결과는 보는 사람과 무관하게 같아서 캐시 키에 토큰을 넣지 않는다
export function getReviewAnalysis(postId: number, token: string) {
  return cached(`${REVIEW_KEY}analysis:${postId}`, 5 * MINUTE, async () => {
    const params = new URLSearchParams({ postId: String(postId) })
    const res = await fetch(`/api/post/review/analysis?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) await throwApiError(res)
    const json = await res.json()
    const data = json?.data
    if (!data) return null
    return {
      summary: typeof data.summary === 'string' ? data.summary : '',
      keywords: Array.isArray(data.keywords) ? data.keywords.filter((k: unknown) => typeof k === 'string') : [],
      // 응답 키가 snake_case(analyzed_review_count, analyzed_at)로 안내돼서 기존 camelCase 와 둘 다 받는다
      analyzedReviewCount: Number(data.analyzedReviewCount ?? data.analyzed_review_count) || 0,
      updatedAt: data.updatedAt ?? data.analyzedAt ?? data.analyzed_at ?? null,
    } as ReviewAnalysis
  })
}
