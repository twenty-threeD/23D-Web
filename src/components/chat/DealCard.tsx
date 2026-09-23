"use client"

import { IoBagCheckOutline, IoCheckmark, IoClose, IoLockClosedOutline } from "react-icons/io5"

type DealCardProps =
  | {
      kind: "request"
      orderName?: string
      amount?: number
      /** 이미 완료·취소된 거래라 더 누를 게 없는 상태 */
      ended?: "completed" | "canceled" | null
      /** 갑(대금을 지급한 쪽)에게만 넘긴다. 없으면 기다리는 쪽 문구가 나온다 */
      onComplete?: () => void
      busy?: boolean
    }
  | {
      kind: "completed" | "canceled"
      /** 내가 끝낸 쪽인지. 문구가 달라진다 */
      isSent: boolean
      endedAt?: string | null
    }

function formatDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

// 결제 카드와 같은 골격(색 헤더 + 가운데 정렬 본문)을 쓰고, 상태별로 색만 바꾼다.
// 완료는 결제와 같은 초록 계열, 취소는 되돌릴 수 없는 종료라 무채색으로 구분한다.
export default function DealCard(props: DealCardProps) {
  if (props.kind === "request") {
    const amount = props.amount != null ? `${Number(props.amount).toLocaleString()}원` : null
    return (
      <div className="animate-chat-card w-72 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_2px_10px_rgba(254,106,76,.12)]">
        <div className="flex flex-col items-center gap-2 bg-main px-3.5 pt-5 pb-4.5">
          <div className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12">
            <IoBagCheckOutline className="text-xl text-white" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold tracking-tight text-white">작업을 받으셨나요?</span>
            <span className="text-[10.5px] text-white/70">거래를 완료하면 채팅이 종료돼요</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-3.5 pt-4 pb-3.5">
          {amount && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10.5px] font-medium tracking-wider text-zinc-400">거래 금액</span>
              <span className="text-[26px] font-bold leading-tight tracking-tighter text-zinc-800">{amount}</span>
            </div>
          )}

          {props.orderName && (
            <div className="flex items-center gap-2 rounded-[10px] bg-orange-50 px-2.5 py-2.5">
              <IoBagCheckOutline className="shrink-0 text-sm text-main" />
              <span className="line-clamp-2 text-[11.5px] leading-snug text-zinc-700">{props.orderName}</span>
            </div>
          )}

          {props.ended ? (
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.75">
              <IoLockClosedOutline className="text-sm text-zinc-400" />
              <span className="text-xs font-semibold tracking-tight text-zinc-500">
                {props.ended === "completed" ? "완료된 거래예요" : "취소된 거래예요"}
              </span>
            </div>
          ) : props.onComplete ? (
            <button
              onClick={props.onComplete}
              disabled={props.busy}
              className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-main shadow-[0_2px_6px_rgba(254,106,76,.32)] transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IoCheckmark className="text-[15px] text-white" />
              <span className="text-[13.5px] font-semibold tracking-tight text-white">거래 완료하기</span>
            </button>
          ) : (
            <span className="text-center text-[10.5px] text-zinc-400">상대방이 거래를 완료하면 알려드려요</span>
          )}
        </div>
      </div>
    )
  }

  const completed = props.kind === "completed"
  const date = formatDate(props.endedAt)
  const title = completed
    ? props.isSent ? "거래를 완료했어요" : "거래가 완료됐어요"
    : props.isSent ? "거래를 취소했어요" : "상대방이 거래를 취소했어요"

  return (
    <div
      className={`animate-chat-card w-72 overflow-hidden rounded-2xl border bg-white ${
        completed ? "border-emerald-200 shadow-[0_2px_10px_rgba(6,95,70,.10)]" : "border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,.06)]"
      }`}
    >
      <div className={`flex flex-col items-center gap-2 px-3.5 pt-5 pb-4.5 ${completed ? "bg-emerald-700" : "bg-zinc-700"}`}>
        <div className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12">
          {completed ? <IoCheckmark className="text-xl text-white" /> : <IoClose className="text-xl text-white" />}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold tracking-tight text-white">{title}</span>
          {date && <span className="text-[10.5px] tabular-nums text-white/60">{date} {completed ? "완료" : "취소"}</span>}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 px-3.5 py-3.5">
        <IoLockClosedOutline className="shrink-0 text-xs text-zinc-400" />
        <span className="text-[11.5px] text-zinc-500">이 채팅방은 더 이상 메시지를 보낼 수 없어요</span>
      </div>
    </div>
  )
}
