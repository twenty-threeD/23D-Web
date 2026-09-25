"use client"

import { useState, type ReactNode } from "react"
import { LuX } from "react-icons/lu"
import { type PriceCardPlan, type PriceCardItem, DEFAULT_PLAN, MAX_PLANS } from "@/src/types/priceCard"
import { INPUT_BOX } from "@/src/components/write/WriteInputField"

function PlanField({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink leading-none">{label}</label>
        {aside}
      </div>
      {children}
    </div>
  )
}

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

  const displayPrice = plan.price ? Number(plan.price).toLocaleString() : ""

  return (
    <div className="flex flex-col gap-4">
      <PlanField label="플랜 이름">
        <input
          className={`${INPUT_BOX} h-[38px] text-xs`}
          placeholder="예) 에어컨 청소(1회 기준)"
          value={plan.planName}
          onChange={(e) => update({ planName: e.target.value })}
        />
      </PlanField>

      <PlanField label="최소 가격">
        <label className={`${INPUT_BOX} h-[38px] text-xs flex items-center gap-2 focus-within:border-main`}>
          <input
            className="flex-1 min-w-0 focus:outline-none placeholder:text-ink-hint"
            placeholder="최소 가격을 입력해주세요."
            inputMode="numeric"
            value={displayPrice}
            // 상태에는 콤마 없는 숫자 문자열만 저장한다 (직렬화 형식 유지)
            onChange={(e) => update({ price: e.target.value.replace(/[^0-9]/g, "") })}
          />
          <span className="text-ink-hint">원</span>
        </label>
      </PlanField>

      <PlanField label="플랜 설명">
        <textarea
          className={`${INPUT_BOX} h-16 py-3 text-xs resize-none`}
          placeholder="예 ) 실외기, 실내기 고압 세척 & 필터 교체 & 세척"
          value={plan.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </PlanField>

      <PlanField
        label="포함 항목"
        aside={
          <button type="button" onClick={addItem} className="text-xs font-medium text-main cursor-pointer">
            + 항목 추가
          </button>
        }
      >
        {plan.items.length > 0 && (
          <div className="flex flex-col gap-2">
            {plan.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  className={`${INPUT_BOX} flex-1 h-[38px] text-xs`}
                  placeholder="항목명"
                  value={item.name}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="size-6.5 flex items-center justify-center text-line hover:text-ink-hint cursor-pointer"
                  aria-label={`항목 ${i + 1} 삭제`}
                >
                  <LuX className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PlanField>
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
    <div className="flex flex-col gap-6 border border-line rounded-[10px] px-[23px] pt-[27px] pb-7">
      <div className="flex flex-col gap-[35px]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink leading-none">서비스 플랜</h3>
          <button
            type="button"
            onClick={addPlan}
            disabled={safePlans.length >= MAX_PLANS}
            className="text-xs font-medium text-main cursor-pointer disabled:text-line disabled:cursor-not-allowed"
          >
            + 플랜 추가 ({safePlans.length}/{MAX_PLANS})
          </button>
        </div>

        {/* 활성 탭의 밑줄이 전체 구분선 위에 겹쳐 보이도록 구분선을 따로 깔아둔다 */}
        <div className="relative flex">
          <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
          {safePlans.map((_, i) => (
            <div
              key={i}
              className={`group relative flex items-center justify-center min-w-18 h-[22px] border-b ${
                i === active ? "border-main text-main" : "border-line text-line hover:text-ink-hint"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className="h-full px-3 pb-1.5 flex items-end text-base font-semibold leading-none cursor-pointer"
              >
                {/* 탭 폭이 시안상 고정이라, 긴 플랜 이름 대신 번호로 표시한다 */}
                플랜 {i + 1}
              </button>
              {safePlans.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlan(i)}
                  className="absolute -top-2 right-0 hidden group-hover:flex group-focus-within:flex size-4 items-center justify-center rounded-full bg-white text-line hover:text-ink-hint cursor-pointer"
                  aria-label={`플랜 ${i + 1} 삭제`}
                >
                  <LuX className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <SinglePlanEditor
        plan={safePlans[active]}
        onChange={(nextPlan) => onChange(safePlans.map((p, i) => (i === active ? nextPlan : p)))}
      />
    </div>
  )
}
