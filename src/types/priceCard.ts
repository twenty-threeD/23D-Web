export interface PriceCardItem {
  name: string
  included: boolean
}

export interface PriceCardPlan {
  planName: string
  price: string
  description: string
  items: PriceCardItem[]
}

export const MAX_PLANS = 3

export const DEFAULT_PLAN: PriceCardPlan = {
  planName: "",
  price: "",
  description: "",
  items: [],
}

export interface PostContent {
  description: string
  plans: PriceCardPlan[]
}

// content는 게시글 본문에 JSON 문자열로 저장된다. plans가 없는 기존 글은
// 예전 단일 plan 형태로 저장돼 있으므로 배열로 감싸 하위 호환한다.
export function parsePostContent(content: string): PostContent {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object" && "description" in parsed) {
      const plans: PriceCardPlan[] = Array.isArray(parsed.plans)
        ? parsed.plans
        : parsed.plan
          ? [parsed.plan]
          : []
      return { description: parsed.description ?? "", plans }
    }
  } catch {}
  return { description: content, plans: [] }
}

export function serializePostContent(description: string, plans: PriceCardPlan[]): string {
  return JSON.stringify({ description, plans })
}
