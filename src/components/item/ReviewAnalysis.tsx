"use client"

import { useEffect, useId, useState } from "react"
import { ApiError } from "@/src/lib/apiError"
import { getReviewAnalysis, type ReviewAnalysis as ReviewAnalysisData } from "@/src/lib/review"

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: ReviewAnalysisData }
  | { kind: "analyzing" }
  | { kind: "hidden" }

// 시안(Service-info) 의 AI 리뷰 요약 카드. 일반 리뷰와 구분되도록 브랜드 오렌지 그라데이션 보더와 스파클 아이콘을 쓴다.
// 리뷰가 부족하거나 분석이 실패·미설정이면 보여줄 게 없어 카드를 통째로 숨긴다
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

  if (state.kind === "hidden") return null

  const meta =
    state.kind === "ready"
      ? [
          state.data.analyzedReviewCount > 0 ? `리뷰 ${state.data.analyzedReviewCount}개 분석` : null,
          formatRelative(state.data.updatedAt),
        ]
          .filter(Boolean)
          .join(" · ")
      : null

  return (
    // 보더에 그라데이션을 주려면 border 속성으로는 안 돼서, 그라데이션 배경 + 1px 패딩으로 감싼다
    <section
      aria-label="AI 리뷰 요약"
      aria-busy={state.kind !== "ready"}
      className="rounded-xl p-px bg-linear-to-br from-main/70 via-main/20 to-[#ececec]"
    >
      <div className="flex flex-col gap-4 p-5 rounded-[11px] bg-linear-to-br from-[#fff6f3] via-white to-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SparkleIcon spinning={state.kind !== "ready"} />
            <h3 className="font-semibold text-ink">AI 리뷰 요약</h3>
          </div>
          {meta && <span className="text-xs text-ink-muted">{meta}</span>}
        </div>

        {state.kind === "ready" ? (
          <>
            <p className="whitespace-pre-line text-[15px] font-medium text-ink leading-[1.6]">{state.data.summary}</p>
            {state.data.keywords.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {state.data.keywords.map((keyword) => (
                  <li key={keyword} className="px-3 py-1 rounded-full bg-main/10 text-xs font-medium text-main">
                    # {keyword}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-ink-muted">AI가 리뷰를 바탕으로 작성한 요약이라 실제와 다를 수 있어요.</p>
          </>
        ) : (
          // 로딩 중에도 자리를 잡아둬야 응답이 왔을 때 아래 리뷰 목록이 밀려 내려가지 않는다
          <div className="flex flex-col gap-2.5 animate-pulse">
            <div className="h-3.5 w-11/12 rounded-full bg-main/10" />
            <div className="h-3.5 w-2/3 rounded-full bg-main/10" />
            {state.kind === "analyzing" && (
              <p className="pt-1 text-xs text-ink-sub">리뷰를 분석하고 있어요. 잠시 후 다시 확인해주세요.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function SparkleIcon({ spinning }: { spinning: boolean }) {
  // 한 페이지에 카드가 여러 번 그려져도 그라데이션 id 가 겹치지 않게 한다
  const gradientId = useId()
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden
      className={spinning ? "animate-[spin_3s_linear_infinite]" : undefined}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9a7f" />
          <stop offset="100%" stopColor="var(--color-main)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2c.4 4.6 2.9 7.6 8 10-5.1 2.4-7.6 5.4-8 10-.4-4.6-2.9-7.6-8-10 5.1-2.4 7.6-5.4 8-10Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

// 요약이 언제 갱신됐는지 알아야 오래된 분석인지 판단할 수 있어 상대 시간으로 보여준다
function formatRelative(iso: string | null) {
  if (!iso) return null
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return null
  const minutes = Math.floor((Date.now() - time) / 60000)
  if (minutes < 1) return "방금 업데이트"
  if (minutes < 60) return `${minutes}분 전 업데이트`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전 업데이트`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전 업데이트`
  return `${new Date(iso).toLocaleDateString("ko-KR")} 업데이트`
}
