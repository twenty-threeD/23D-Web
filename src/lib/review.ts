import { throwApiError } from './apiError'

/**
 * 후기 API 연결 위치
 *
 * 주의: 아래 API는 백엔드 명세를 확인하지 못한 상태에서 추정해서 연결한 API입니다.
 * - 추정된 조회 API: GET /api/review?postId={게시글ID}&page={페이지}&size={개수}
 * - 추정된 등록 API: POST /api/review
 * - 추정된 등록 요청 본문: { postId, rating, content }
 *
 * 이 경로는 next.config.ts의 rewrite에 의해 백엔드 API 주소로 전달됩니다.
 * 백엔드 명세가 확정되면 위 경로와 필드명을 실제 명세에 맞춰 수정해야 합니다.
 * 사용처: src/app/item/[[...id]]/page.tsx의 서비스 상세 페이지 후기 영역
 */

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

function getReviewList(json: ReviewResponse | unknown) {
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

  return list.map((review, index) => normalizeReview(review, index))
}

export async function getReviews(postId: number, token?: string | null, page = 0, size = 20) {
  // TODO: 추정된 API입니다. 백엔드 후기 조회 엔드포인트 확정 후 경로를 확인하세요.
  const params = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) })
  const res = await fetch(`/api/review?${params}`, { headers: authHeaders(token) })
  if (!res.ok) await throwApiError(res)
  return getReviewList(await res.json())
}

export async function createReview(
  token: string,
  data: { postId: number; rating: number; content: string }
) {
  // TODO: 추정된 API입니다. 백엔드 후기 등록 엔드포인트와 요청 필드를 확인하세요.
  const res = await fetch('/api/review', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)

  const json = await res.json()
  const response = asRecord(json)
  return response.data ? normalizeReview(response.data) : null
}
