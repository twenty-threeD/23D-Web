"use client"

import { IoBagCheckOutline, IoChatbubbleEllipsesOutline, IoCheckmark, IoClose } from "react-icons/io5"

type DealCardProps =
  | {
      // 결제 후 갑이 직접 완료를 누르던 예전 방식의 카드. 이제 완료는 결제로 바로 정해지므로
      // 지난 대화에 남은 카드를 그릴 때만 쓰고, 누를 버튼 없이 그 방의 결과만 보여준다
      kind: "request"
      orderName?: string
      amount?: number
      ended: "completed" | "canceled"
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
      <div className="animate-chat-card w-[min(16rem,68vw)] lg:w-72 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_2px_10px_rgba(254,106,76,.12)]">
        <div className="flex flex-col items-center gap-2 bg-main px-3.5 pt-5 pb-4.5">
          <div className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12">
            <IoBagCheckOutline className="text-xl text-white" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold tracking-tight text-white">작업을 받으셨나요?</span>
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

          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.75">
            <span className="text-xs font-semibold tracking-tight text-zinc-500">
              {props.ended === "completed" ? "완료된 거래예요" : "취소된 거래예요"}
            </span>
          </div>
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
      className={`animate-chat-card w-[min(16rem,68vw)] lg:w-72 overflow-hidden rounded-2xl border bg-white ${
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

      {/* 거래가 끝나도 채팅은 막지 않는다. 같은 글로 다시 문의하면 이 방에서 새 거래를 이어간다 */}
      <div className="flex items-center justify-center gap-1.5 px-3.5 py-3.5">
        <IoChatbubbleEllipsesOutline className="shrink-0 text-xs text-zinc-400" />
        <span className="text-[11.5px] text-zinc-500">대화는 이어서 할 수 있어요</span>
      </div>
    </div>
  )
}
