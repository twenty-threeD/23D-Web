"use client"

import { IoChevronForward, IoEllipsisHorizontal } from "react-icons/io5"
import { type PriceCardPlan } from "@/src/types/priceCard"
import Modal from "@/src/components/ui/Modal"

interface ServicePickerModalProps {
  plans: PriceCardPlan[]
  busy?: boolean
  onClose: () => void
  onSelect: (service: { planName: string; price: string }) => void
}

export default function ServicePickerModal({ plans, busy, onClose, onSelect }: ServicePickerModalProps) {
  return (
    <Modal title="어떤 서비스가 궁금하세요?" width="sm" onClose={onClose}>
      <p className="text-sm text-zinc-500">문의하실 서비스를 선택해주세요.</p>

      <div className="flex flex-col gap-2">
        {plans.map((plan, i) => (
          <button
            key={i}
            disabled={busy}
            onClick={() => onSelect({ planName: plan.planName || `플랜 ${i + 1}`, price: plan.price })}
            className="group flex items-center justify-between gap-3 w-full px-4 py-3.5 border border-zinc-300 rounded-lg hover:border-main hover:bg-main/5 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-semibold text-sm truncate">{plan.planName || `플랜 ${i + 1}`}</span>
              {plan.price && (
                <span className="text-xs text-zinc-500">
                  {Number(plan.price.replace(/,/g, "")).toLocaleString()}원~
                </span>
              )}
            </div>
            <IoChevronForward className="text-zinc-300 group-hover:text-main shrink-0 transition-colors" />
          </button>
        ))}
        <button
          disabled={busy}
          onClick={() => onSelect({ planName: "기타", price: "" })}
          className="group flex items-center justify-between gap-3 w-full px-4 py-3.5 border border-dashed border-zinc-300 rounded-lg hover:border-main hover:bg-main/5 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <IoEllipsisHorizontal className="text-base" />
            기타
          </span>
          <IoChevronForward className="text-zinc-300 group-hover:text-main shrink-0 transition-colors" />
        </button>
      </div>
    </Modal>
  )
}
