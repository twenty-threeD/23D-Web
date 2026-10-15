"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"
import { ApiError } from "@/src/lib/apiError"
import { getReviewAnalysis, type ReviewAnalysis as ReviewAnalysisData } from "@/src/lib/review"
import { useAuthStore } from "@/src/store/authStore"

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: ReviewAnalysisData }
  | { kind: "analyzing" }
  | { kind: "notEnough" }
  | { kind: "failed" }
  | { kind: "login" }
  | { kind: "hidden" }

// 409 는 첫 분석이 다른 요청에서 돌고 있다는 뜻이라 잠시 뒤 다시 물어보면 결과가 온다.
// 분석 한 번이 최대 40초라 그보다 넉넉히 기다리고, 그래도 안 끝나면 실패로 보고 멈춘다
const RETRY_DELAY_MS = 5000
const MAX_RETRIES = 12
// 새로 분석할 땐 응답이 수십 초 걸릴 수 있어, 이 시간이 지나도 응답이 없으면 기다리는 이유를 알려준다
const SLOW_HINT_DELAY_MS = 3000

// 시안(Service-info) 의 AI 리뷰 요약 카드. 일반 리뷰와 구분되도록 브랜드 오렌지 그라데이션 보더와 스파클 아이콘을 쓴다.
// 없는 게시글(404)·서버 미설정(503)처럼 사용자가 할 수 있는 게 없는 경우엔 카드를 통째로 숨긴다
export default function ReviewAnalysis({ postId }: { postId: number }) {
  const token = useAuthStore((s) => s.accessToken)
  const [fetched, setState] = useState<State>({ kind: "loading" })
  const [attempt, setAttempt] = useState(0)
  const [slow, setSlow] = useState(false)
  // attempt 는 409 재조회 횟수라 '다시 시도' 때 0 으로 돌린다. 이미 0 이면 effect 가 안 돌아서 별도 키로 다시 부른다
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const slowTimer = setTimeout(() => !cancelled && setSlow(true), SLOW_HINT_DELAY_MS)
    getReviewAnalysis(postId, token)
      .then((data) => {
        if (cancelled) return
        setState(data && data.summary ? { kind: "ready", data } : { kind: "hidden" })
      })
      .catch((e) => {
        if (cancelled) return
        setState(toErrorState(e, attempt))
      })
      .finally(() => clearTimeout(slowTimer))
    return () => {
      cancelled = true
      clearTimeout(slowTimer)
    }
  }, [postId, token, attempt, reloadKey])

  // 비로그인이면 어차피 401 이라 요청 없이 로그인 안내를 띄운다. effect 에서 setState 하지 않으려고 렌더 때 계산한다
  const state: State = token ? fetched : { kind: "login" }

  // 분석 중이면 일정 간격으로 다시 조회한다. attempt 를 올리면 위 effect 가 다시 돈다
  useEffect(() => {
    if (!token || fetched.kind !== "analyzing") return
    const timer = setTimeout(() => setAttempt((n) => n + 1), RETRY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [token, fetched, attempt])

  const retry = () => {
    setState({ kind: "loading" })
    setSlow(false)
    setAttempt(0)
    setReloadKey((k) => k + 1)
  }

  if (state.kind === "hidden") return null

  const pending = state.kind === "loading" || state.kind === "analyzing"
  const meta =
    state.kind === "ready"
      ? [
          // 분석에 쓰인 리뷰 수라 현재 리뷰 수와 다를 수 있다. 그래서 '분석' 을 붙여 구분한다
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
      aria-busy={pending}
      className="rounded-xl p-px bg-linear-to-br from-main/70 via-main/20 to-[#ececec]"
    >
      <div className="flex flex-col gap-4 p-5 rounded-[11px] bg-linear-to-br from-[#fff6f3] via-white to-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SparkleIcon spinning={pending} />
            <h3 className="font-semibold text-ink">AI 리뷰 요약</h3>
          </div>
          {meta && <span className="text-xs text-ink-muted">{meta}</span>}
        </div>

        {state.kind === "ready" && (
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
        )}

        {pending && (
          // 로딩 중에도 자리를 잡아둬야 응답이 왔을 때 아래 리뷰 목록이 밀려 내려가지 않는다
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-2.5 animate-pulse">
              <div className="h-3.5 w-11/12 rounded-full bg-main/10" />
              <div className="h-3.5 w-2/3 rounded-full bg-main/10" />
            </div>
            {(state.kind === "analyzing" || slow) && (
              <p className="pt-1 text-xs text-ink-sub">AI가 리뷰를 읽고 있어요. 처음 분석할 땐 30초 정도 걸릴 수 있어요.</p>
            )}
          </div>
        )}

        {state.kind === "notEnough" && (
          <p className="text-sm text-ink-sub">리뷰가 3개 이상 쌓이면 AI가 리뷰를 요약해드려요.</p>
        )}

        {state.kind === "failed" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-sub">리뷰 분석에 실패했어요. 잠시 후 다시 시도해주세요.</p>
            <button
              type="button"
              onClick={retry}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-main text-xs font-medium text-main hover:bg-main/5 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {state.kind === "login" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-sub">로그인하면 AI가 정리한 리뷰 요약을 볼 수 있어요.</p>
            <Link
              href="/login/signin"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-main text-xs font-medium text-white hover:opacity-90 transition-opacity"
            >
              로그인
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function toErrorState(e: unknown, attempt: number): State {
  if (!(e instanceof ApiError)) return { kind: "failed" }
  // 토큰이 만료된 경우. 다시 로그인하면 볼 수 있다
  if (e.status === 401) return { kind: "login" }
  switch (e.code) {
    case "REVIEW_ANALYSIS_IN_PROGRESS":
      return attempt < MAX_RETRIES ? { kind: "analyzing" } : { kind: "failed" }
    case "NOT_ENOUGH_REVIEWS_TO_ANALYZE":
      return { kind: "notEnough" }
    case "REVIEW_ANALYSIS_FAILED":
      return { kind: "failed" }
    default:
      // MEMBER_NOT_FOUND(404)·REVIEW_ANALYSIS_NOT_CONFIGURED(503) 등은 다시 시도해도 달라지지 않는다
      return { kind: "hidden" }
  }
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

// 요약이 언제 갱신됐는지 알아야 오래된 분석인지 판단할 수 있어 상대 시간으로 보여준다.
// 서버가 UTC(Z) 로 주므로 Date 파싱만으로 로컬 시간과 비교된다
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
