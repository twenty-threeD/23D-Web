"use client"

import { type PriceCardPlan, type PriceCardItem } from "@/src/types/priceCard"

interface PriceCardEditorProps {
  plan: PriceCardPlan
  onChange: (plan: PriceCardPlan) => void
}

export default function PriceCardEditor({ plan, onChange }: PriceCardEditorProps) {
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
    <div className="flex flex-col gap-4 border border-zinc-300 rounded-lg p-5">
      <h3 className="font-bold text-lg">서비스 플랜</h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-600">플랜 이름</label>
        <input
          className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main"
          placeholder="예) 에어컨 청소 (1회 기준)"
          value={plan.planName}
          onChange={(e) => update({ planName: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-600">가격 (최소)</label>
        <div className="flex items-center border border-zinc-300 rounded-md px-3 py-2 gap-1">
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
          className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main resize-none"
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
              className="flex-1 border border-zinc-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-main"
              placeholder="항목명"
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
            />
            <button
              type="button"
              onClick={() => updateItem(i, { included: !item.included })}
              className={`w-10 py-1.5 rounded-md text-sm font-bold cursor-pointer ${
                item.included ? "bg-main text-white" : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {item.included ? "O" : "X"}
            </button>
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
