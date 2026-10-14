"use client"

import { useEffect, useState } from "react"
import { ApiError } from "@/src/lib/apiError"
import { getReviewAnalysis, type ReviewAnalysis as ReviewAnalysisData } from "@/src/lib/review"

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: ReviewAnalysisData }
  | { kind: "analyzing" }
  | { kind: "hidden" }

// 전문가가 받은 리뷰를 AI 가 요약한 카드. 리뷰 목록 위에 두고 후기 작성 폼과 같은 회색 카드 모양을 쓴다.
// 리뷰가 부족하거나 분석이 실패·미설정이면 보여줄 게 없어 카드를 통째로 숨긴다. 분석 중일 때만 안내를 남긴다
export default function ReviewAnalysis({ memberId }: { memberId: number }) {
  const [state, setState] = useState<State>({ kind: "loading" })

  useEffect(() => {
    let cancelled = false
    getReviewAnalysis(memberId)
      .then((data) => {
        if (cancelled) return
        setState(data && data.summary ? { kind: "ready", data } : { kind: "hidden" })
      })
      .catch((e) => {
        if (cancelled) return
        setState(e instanceof ApiError && e.code === "REVIEW_ANALYSIS_IN_PROGRESS" ? { kind: "analyzing" } : { kind: "hidden" })
      })
    return () => {
      cancelled = true
    }
  }, [memberId])

  if (state.kind === "loading" || state.kind === "hidden") return null

  return (
    <section aria-label="AI 리뷰 요약" className="flex flex-col gap-3 p-5 rounded-xl bg-[#fafafa]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">AI 리뷰 요약</h3>
        {state.kind === "ready" && state.data.analyzedReviewCount > 0 && (
          <span className="text-xs text-ink-sub">리뷰 {state.data.analyzedReviewCount}개 분석</span>
        )}
      </div>

      {state.kind === "analyzing" ? (
        <p className="text-sm text-ink-sub">리뷰를 분석하고 있어요. 잠시 후 다시 확인해주세요.</p>
      ) : (
        <>
          <p className="whitespace-pre-line text-sm font-medium text-ink-sub leading-[1.5]">{state.data.summary}</p>
          {state.data.keywords.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {state.data.keywords.map((keyword) => (
                <li key={keyword} className="px-2.5 py-1 rounded-full border border-main bg-white text-xs font-medium text-main">
                  {keyword}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
