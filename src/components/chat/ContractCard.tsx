"use client"

import {
  IoCalendarOutline,
  IoCardOutline,
  IoCheckmark,
  IoChevronForward,
  IoDocumentTextOutline,
  IoListOutline,
  IoLockClosedOutline,
} from "react-icons/io5"
import { toRelativeUrl } from "@/src/lib/file"

// 계약 카드 전용 브라운 팔레트(#452B24 계열). 전역 --color-contract(계약서 본문 남색)와는 별개로 시안을 따른다.

interface ContractCardBase {
  /** 내가 보낸 메시지인지 (보낸 쪽/받은 쪽 문구가 달라진다) */
  isSent: boolean
  price?: string | number | null
}

interface ProposeCardProps extends ContractCardBase {
  kind: "propose"
  startDate?: string | null
  endDate?: string | null
  serviceContent?: string | null
  /** 보낸 쪽(을) 대기 카드에 표시할 전송 시각 */
  sentAt?: string | null
  /** 이 제안 이후에 체결 완료 메시지가 있으면 true. 대기 표시·서명 버튼을 걷는다 */
  settled?: boolean
  /** 받은 쪽(갑)만 검토·서명할 수 있다 */
  onReview?: () => void
}

interface CompletedCardProps extends ContractCardBase {
  kind: "completed"
  contractUrl?: string | null
  /** 체결 시각 */
  signedAt?: string | null
  /** 결제는 계약을 등록한 갑이 한다 */
  onPay?: () => void
}

type ContractCardProps = ProposeCardProps | CompletedCardProps

function formatPrice(price?: string | number | null) {
  if (price === null || price === undefined) return null
  const digits = String(price).replace(/[^0-9]/g, "")
  if (!digits) return null
  return `${Number(digits).toLocaleString()}원`
}

function toDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(value?: string | null) {
  const d = toDate(value)
  if (!d) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

function formatDateTime(value?: string | null) {
  const d = toDate(value)
  if (!d) return null
  return `${formatDate(value)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const cardClass = "animate-chat-card w-72 overflow-hidden rounded-2xl bg-white"

// 금액 라벨 + 큰 숫자. 제안 카드는 왼쪽, 체결 카드는 가운데 정렬.
function PriceBlock({ value, center }: { value: string; center?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${center ? "items-center" : ""}`}>
      <span className="text-[10.5px] font-medium tracking-wider text-zinc-400">계약 금액</span>
      <span
        className={`font-bold leading-tight tracking-tighter text-[#452B24] ${center ? "text-[26px]" : "text-2xl"}`}
      >
        {value}
      </span>
    </div>
  )
}

// 계약서 제안 / 체결 완료 메시지를 말풍선 대신 카드로 보여준다.
export default function ContractCard(props: ContractCardProps) {
  const formattedPrice = formatPrice(props.price)

  if (props.kind === "completed") {
    const signedDate = formatDate(props.signedAt)

    return (
      <div className={`${cardClass} border border-[#E4D3CC] shadow-[0_2px_10px_rgba(69,43,36,.10)]`}>
        <div className="flex flex-col items-center gap-2 bg-[#452B24] px-3.5 pt-5 pb-4.5">
          <div className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12">
            <IoCheckmark className="text-xl text-white" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold tracking-tight text-white">계약이 체결되었어요</span>
            {signedDate && (
              <span className="text-[10.5px] tabular-nums text-white/60">{signedDate} 체결</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-3.5 pt-4 pb-3.5">
          {formattedPrice && <PriceBlock value={formattedPrice} center />}

          <div className="flex items-center gap-2 rounded-[10px] bg-[#FAF3F0] px-2.5 py-2.5">
            <IoLockClosedOutline className="shrink-0 text-sm text-[#9A7A70]" />
            <span className="text-[11.5px] leading-snug text-[#6E4A40]">
              양측 서명이 완료되어 계약서가 보관되었습니다
            </span>
          </div>

          {props.onPay ? (
            // 갑: 계약서 확인 + 결제
            <div className="flex gap-2">
              {props.contractUrl && (
                <a
                  href={toRelativeUrl(props.contractUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 basis-2/5 items-center justify-center rounded-xl border border-zinc-300 text-[13px] font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
                >
                  계약서 보기
                </a>
              )}
              <button
                onClick={props.onPay}
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-main shadow-[0_2px_6px_rgba(254,106,76,.32)] transition-colors hover:bg-orange-600"
              >
                <IoCardOutline className="text-[15px] text-white" />
                <span className="text-[13.5px] font-semibold text-white">결제하기</span>
              </button>
            </div>
          ) : (
            // 을: 결제를 기다리는 쪽
            <>
              {props.contractUrl && (
                <a
                  href={toRelativeUrl(props.contractUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#452B24] text-[#452B24] transition-colors hover:bg-[#452B24] hover:text-white"
                >
                  <IoDocumentTextOutline className="text-[15px]" />
                  <span className="text-[13.5px] font-semibold">계약서 보기</span>
                </a>
              )}
              <span className="text-center text-[10.5px] text-zinc-400">
                결제가 완료되면 알림으로 안내드려요
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  const period = [formatDate(props.startDate), formatDate(props.endDate)].filter(Boolean).join(" ~ ")
  const sentAt = formatDateTime(props.sentAt)

  return (
    <div className={`${cardClass} border border-zinc-200 shadow-[0_1px_3px_rgba(69,43,36,.08)]`}>
      {props.isSent || props.settled ? (
        // 을(보낸 쪽), 또는 이미 체결돼서 더 할 일이 없는 카드: 톤을 낮춘 헤더
        <div className="flex items-center gap-2.5 border-b border-[#EADCD6] bg-[#F8F0ED] px-3.5 py-3">
          <div className="flex size-6.5 items-center justify-center rounded-lg border border-[#EADCD6] bg-white">
            <IoDocumentTextOutline className="text-sm text-[#452B24]" />
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[13px] font-semibold tracking-tight text-[#452B24]">
              {props.isSent ? "계약서를 보냈어요" : "계약서가 도착했어요"}
            </span>
            <span className="text-[10.5px] text-[#9A7A70]">
              {props.settled ? "이미 체결된 계약이에요" : "상대방이 서명하면 계약이 체결돼요"}
            </span>
          </div>
        </div>
      ) : (
        // 갑(받은 쪽): 액션이 필요한 상태라 헤더를 꽉 채운다
        <div className="flex items-center gap-2.5 bg-[#452B24] px-3.5 py-3">
          <div className="flex size-6.5 items-center justify-center rounded-lg bg-white/15">
            <IoDocumentTextOutline className="text-sm text-white" />
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[13px] font-semibold tracking-tight text-white">
              계약서가 도착했어요
            </span>
            <span className="text-[10.5px] text-white/60">서명하면 계약이 체결됩니다</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-3.5 pt-4 pb-3.5">
        {formattedPrice && <PriceBlock value={formattedPrice} />}

        {(period || props.serviceContent) && (
          <>
            <div className="h-px bg-[repeating-linear-gradient(to_right,#E4E4E7_0_5px,transparent_5px_10px)]" />
            <div className="flex flex-col gap-2.5">
              {period && (
                <div className="flex items-center gap-2">
                  <IoCalendarOutline className="shrink-0 text-sm text-zinc-400" />
                  <span className="text-xs font-medium tabular-nums text-zinc-700">{period}</span>
                </div>
              )}
              {props.serviceContent && (
                <div className="flex gap-2 rounded-[10px] border border-zinc-100 bg-zinc-50 px-2.5 py-2.5">
                  <IoListOutline className="mt-0.5 shrink-0 text-sm text-zinc-400" />
                  <span className="line-clamp-2 text-xs leading-relaxed text-zinc-600">
                    {props.serviceContent}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {props.settled ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-[#EADCD6] bg-[#FAF3F0] px-3 py-2.75">
            <IoCheckmark className="text-sm text-[#9A7A70]" />
            <span className="text-xs font-semibold tracking-tight text-[#6E4A40]">체결 완료</span>
          </div>
        ) : props.onReview ? (
          <button
            onClick={props.onReview}
            className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-main shadow-[0_2px_6px_rgba(254,106,76,.32)] transition-colors hover:bg-orange-600"
          >
            <span className="text-[13.5px] font-semibold tracking-tight text-white">
              계약서 확인하고 서명하기
            </span>
            <IoChevronForward className="text-[15px] text-white" />
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.75">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-[3px]">
                <span className="animate-contract-dot size-[5px] rounded-full bg-[#452B24]" />
                <span className="animate-contract-dot size-[5px] rounded-full bg-[#452B24] [animation-delay:.18s]" />
                <span className="animate-contract-dot size-[5px] rounded-full bg-[#452B24] [animation-delay:.36s]" />
              </span>
              <span className="text-xs font-semibold tracking-tight text-zinc-700">
                상대방의 확인을 기다리는 중
              </span>
            </div>
            <div className="relative h-[3px] overflow-hidden rounded-full bg-zinc-200">
              <span className="animate-contract-sweep absolute top-0 left-0 h-full w-[30%] rounded-full bg-[#452B24]" />
            </div>
            {sentAt && <span className="text-[10.5px] tabular-nums text-zinc-400">전송 {sentAt}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
