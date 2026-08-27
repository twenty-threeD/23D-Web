// 구인구직 글은 커뮤니티 글과 같은 게시글 API를 쓰지만, 본문에 아래 항목이
// 반드시 들어가야 한다. priceCard와 마찬가지로 content에 JSON으로 직렬화해
// 저장하고, 예전(혹은 일반) 글은 description만 있는 것으로 하위 호환한다.

export interface JobPostContent {
  /** 카테고리 (직군 카테고리와 동일) */
  categoryId: number | null
  categoryName: string
  /** 원하는 서비스를 설명하는 글 (마크다운) */
  description: string
  /** 희망 가격 */
  budget: string
  /** 희망 시공날짜 (YYYY-MM-DD) */
  desiredDate: string
  /** 위치 — 없을 수 있다 */
  location: string | null
}

const JOB_CONTENT_KIND = "job"

export const EMPTY_JOB_CONTENT: JobPostContent = {
  categoryId: null,
  categoryName: "",
  description: "",
  budget: "",
  desiredDate: "",
  location: null,
}

export function parseJobContent(content: string): JobPostContent {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object" && parsed.kind === JOB_CONTENT_KIND) {
      return {
        categoryId: typeof parsed.categoryId === "number" ? parsed.categoryId : null,
        categoryName: parsed.categoryName ?? "",
        description: parsed.description ?? "",
        budget: parsed.budget ?? "",
        desiredDate: parsed.desiredDate ?? "",
        location: parsed.location || null,
      }
    }
  } catch {}
  return { ...EMPTY_JOB_CONTENT, description: content }
}

export function serializeJobContent(job: JobPostContent): string {
  return JSON.stringify({
    kind: JOB_CONTENT_KIND,
    categoryId: job.categoryId,
    categoryName: job.categoryName,
    description: job.description,
    budget: job.budget,
    desiredDate: job.desiredDate,
    location: job.location || null,
  })
}

/** 필수 항목이 모두 채워졌는지 검사한다. 위치는 nullable이라 제외한다. */
export function isJobContentComplete(job: JobPostContent): boolean {
  return (
    job.categoryId !== null &&
    job.description.trim() !== "" &&
    job.budget.trim() !== "" &&
    job.desiredDate.trim() !== ""
  )
}

export function formatBudget(budget: string): string {
  const digits = budget.replace(/[^\d]/g, "")
  if (!digits) return budget
  return `${Number(digits).toLocaleString()}원`
}

export function formatDesiredDate(date: string): string {
  if (!date) return ""
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
}

/** 목록에서 보여줄 한 줄 요약 */
export function jobSummary(content: string): string {
  const job = parseJobContent(content)
  return job.description
}
