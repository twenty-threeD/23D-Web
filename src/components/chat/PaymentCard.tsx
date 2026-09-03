"use client"

import { IoCardOutline, IoCheckmark, IoCubeOutline } from "react-icons/io5"

export interface ChatPayment {
  orderId: string
  orderName: string
  amount: number
  paymentHash?: string | null
  // 블록체인 트랜잭션 해시. 백엔드가 blockchainTxHash 로 주다가 txHash 로 바뀔 예정이라
  // 둘 다 받아둔다 (한쪽만 오면 그쪽을 쓴다).
  blockchainTxHash?: string | null
  txHash?: string | null
}

interface PaymentCardProps {
  payment: ChatPayment
  /** 내가 결제한 쪽인지 (갑). 문구가 달라진다 */
  isSent: boolean
  /** 결제 시각 */
  paidAt?: string | null
}

function formatAmount(amount?: number | null) {
  if (amount === null || amount === undefined) return null
  return `${Number(amount).toLocaleString()}원`
}

function formatDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

// 백엔드가 결제 승인 시 만들어주는 PAYMENT 타입 메시지를 카드로 보여준다.
// (계약 카드와 같은 톤을 쓰되, 결제는 되돌릴 수 없는 완료 상태라 초록 계열로 구분한다)
export default function PaymentCard({ payment, isSent, paidAt }: PaymentCardProps) {
  const amount = formatAmount(payment.amount)
  const paidDate = formatDate(paidAt)
  const txHash = payment.txHash ?? payment.blockchainTxHash

  return (
    <div className="animate-chat-card w-72 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_2px_10px_rgba(6,95,70,.10)]">
      <div className="flex flex-col items-center gap-2 bg-emerald-700 px-3.5 pt-5 pb-4.5">
        <div className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12">
          <IoCheckmark className="text-xl text-white" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold tracking-tight text-white">
            {isSent ? "결제를 완료했어요" : "결제가 완료됐어요"}
          </span>
          {paidDate && (
            <span className="text-[10.5px] tabular-nums text-white/60">{paidDate} 결제</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3.5 pt-4 pb-3.5">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10.5px] font-medium tracking-wider text-zinc-400">결제 금액</span>
          <span className="text-[26px] font-bold leading-tight tracking-tighter text-emerald-800">
            {amount ?? "-"}
          </span>
        </div>

        {payment.orderName && (
          <div className="flex items-center gap-2 rounded-[10px] bg-emerald-50 px-2.5 py-2.5">
            <IoCardOutline className="shrink-0 text-sm text-emerald-600" />
            <span className="line-clamp-2 text-[11.5px] leading-snug text-emerald-900">
              {payment.orderName}
            </span>
          </div>
        )}

        {/* 블록체인에 기록된 결제는 그 사실을 함께 보여준다 */}
        {txHash && (
          <div className="flex items-center gap-1.5">
            <IoCubeOutline className="shrink-0 text-xs text-zinc-400" />
            <span className="truncate text-[10.5px] text-zinc-400" title={txHash}>
              블록체인 기록 완료
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
