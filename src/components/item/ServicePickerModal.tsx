"use client"

import { IoClose, IoChevronForward, IoEllipsisHorizontal } from "react-icons/io5"
import { type PriceCardPlan } from "@/src/types/priceCard"

interface ServicePickerModalProps {
  plans: PriceCardPlan[]
  busy?: boolean
  onClose: () => void
  onSelect: (service: { planName: string; price: string }) => void
}

export default function ServicePickerModal({ plans, busy, onClose, onSelect }: ServicePickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 mx-4 animate-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">어떤 서비스가 궁금하세요?</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <IoClose className="text-xl" />
          </button>
        </div>
        <p className="text-sm text-zinc-500">문의하실 서비스를 선택해주세요.</p>

        <div className="flex flex-col gap-2">
          {plans.map((plan, i) => (
            <button
              key={i}
              disabled={busy}
              onClick={() => onSelect({ planName: plan.planName || `플랜 ${i + 1}`, price: plan.price })}
              className="group flex items-center justify-between gap-3 w-full px-4 py-3.5 border border-zinc-200 rounded-xl hover:border-main hover:bg-main/5 hover:shadow-sm transition-all text-left cursor-pointer disabled:opacity-50"
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
            className="group flex items-center justify-between gap-3 w-full px-4 py-3.5 border border-dashed border-zinc-300 rounded-xl hover:border-main hover:bg-main/5 transition-all text-left cursor-pointer disabled:opacity-50"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
              <IoEllipsisHorizontal className="text-base" />
              기타
            </span>
            <IoChevronForward className="text-zinc-300 group-hover:text-main shrink-0 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
