"use client"

import { useState } from "react"
import { type PriceCardPlan, type PriceCardItem, DEFAULT_PLAN, MAX_PLANS } from "@/src/types/priceCard"

interface SinglePlanEditorProps {
  plan: PriceCardPlan
  onChange: (plan: PriceCardPlan) => void
}

function SinglePlanEditor({ plan, onChange }: SinglePlanEditorProps) {
  function update(partial: Partial<PriceCardPlan>) {
    onChange({ ...plan, ...partial })
  }

  function updateItem(index: number, partial: Partial<PriceCardItem>) {
    const next = plan.items.map((item, i) => i === index ? { ...item, ...partial } : item)
    update({ items: next })
  }

  function addItem() {
    update({ items: [...plan.items, { name: "", included: true }] })
  }

  function removeItem(index: number) {
    update({ items: plan.items.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-600">플랜 이름</label>
        <input
          className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
          placeholder="예) 에어컨 청소 (1회 기준)"
          value={plan.planName}
          onChange={(e) => update({ planName: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-600">가격 (최소)</label>
        <div className="flex items-center gap-1 border border-zinc-300 rounded-lg px-3 py-2.5 transition-colors focus-within:border-main hover:border-zinc-400">
          <input
            className="flex-1 text-sm focus:outline-none"
            placeholder="예) 150000"
            type="number"
            value={plan.price}
            onChange={(e) => update({ price: e.target.value })}
          />
          <span className="text-sm text-zinc-400">원~</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-600">플랜 설명</label>
        <textarea
          className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 resize-none"
          rows={2}
          placeholder="예) 실외기 실내기 고압세척, 필터 교체/세척"
          value={plan.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-600">포함 항목</label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs text-main font-semibold cursor-pointer"
          >
            + 항목 추가
          </button>
        </div>

        {plan.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
              placeholder="항목명"
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PriceCardEditorProps {
  plans: PriceCardPlan[]
  onChange: (plans: PriceCardPlan[]) => void
}

export default function PriceCardEditor({ plans, onChange }: PriceCardEditorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safePlans = plans.length > 0 ? plans : [DEFAULT_PLAN]
  const active = Math.min(activeIndex, safePlans.length - 1)

  function addPlan() {
    if (safePlans.length >= MAX_PLANS) return
    onChange([...safePlans, { ...DEFAULT_PLAN }])
    setActiveIndex(safePlans.length)
  }

  function removePlan(index: number) {
    if (safePlans.length <= 1) return
    const next = safePlans.filter((_, i) => i !== index)
    onChange(next)
    setActiveIndex((prev) => Math.max(0, Math.min(prev, next.length - 1)))
  }

  return (
    <div className="flex flex-col gap-4 border border-zinc-300 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">서비스 플랜</h3>
        <button
          type="button"
          onClick={addPlan}
          disabled={safePlans.length >= MAX_PLANS}
          className="text-xs text-main font-semibold cursor-pointer disabled:text-zinc-300 disabled:cursor-not-allowed"
        >
          + 플랜 추가 ({safePlans.length}/{MAX_PLANS})
        </button>
      </div>

      <div className="flex gap-2 border-b border-zinc-200">
        {safePlans.map((plan, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 cursor-pointer ${
              i === active ? "border-main text-main" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {plan.planName || `플랜 ${i + 1}`}
            {safePlans.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); removePlan(i); }}
                className="text-zinc-300 hover:text-zinc-500"
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>

      <SinglePlanEditor
        plan={safePlans[active]}
        onChange={(nextPlan) => onChange(safePlans.map((p, i) => (i === active ? nextPlan : p)))}
      />
    </div>
  )
}
