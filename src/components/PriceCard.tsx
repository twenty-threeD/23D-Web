"use client"

import { useState } from "react"
import { IoChevronDownOutline } from "react-icons/io5"
import { type PriceCardPlan, FALLBACK_PLAN } from "@/src/types/priceCard"
import InquiryButton from "@/src/components/item/InquiryButton"

interface PriceCardProps {
  username?: string
  plans?: PriceCardPlan[]
  postId?: number
  /** 문의하기 버튼 노출 여부. 결제 페이지처럼 이미 문의를 마친 화면에서는 끈다 */
  showInquiry?: boolean
  /** 지정하면 탭 없이 이 플랜만 보여준다. 결제 화면처럼 선택이 이미 끝난 경우에 쓴다 */
  selectedPlanName?: string | null
  /** 문의하기 버튼에 붙일 클래스. 휴대폰처럼 다른 자리에 버튼을 따로 두는 화면에서 숨길 때 쓴다 */
  inquiryClassName?: string
}

export default function PriceCard({ username, plans, postId, showInquiry = true, selectedPlanName, inquiryClassName }: PriceCardProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const allPlans = plans && plans.length > 0 ? plans : [FALLBACK_PLAN]
  // 선택이 끝난 화면에서는 고른 플랜만 남긴다. 이름이 안 맞으면 전체를 그대로 둔다.
  const picked = selectedPlanName
    ? allPlans.filter((p) => p.planName === selectedPlanName)
    : []
  const safePlans = picked.length > 0 ? picked : allPlans
  const showTabs = safePlans.length > 1
  const active = Math.min(activeIndex, safePlans.length - 1)
  const plan = safePlans[active]

  const displayPrice = plan.price
    ? `${Number(plan.price.replace(/,/g, '')).toLocaleString()}원`
    : "가격 미정"

  // 폭은 놓이는 자리에서 정한다. 여기서 self-start 로 줄이면 사이드바 안에서 내용 폭만큼 쪼그라든다
  return (
    <div className="w-full flex flex-col gap-4 px-2.5 pt-4 pb-5 bg-[#fafafa] rounded-xl">
      <div className="flex flex-col gap-[26px]">
        {/* 플랜 선택 — 시안은 탭 대신 드롭다운으로 플랜을 고른다. 플랜이 하나면 이름만 보여준다.
            회색 테두리는 배경과 대비가 약해 선택된 플랜이 눈에 안 띄어, 시안대로 흰 바탕 + 브랜드색으로 강조한다 */}
        <div className="relative h-[38px] rounded-lg border border-main bg-white font-medium text-main">
          {showTabs ? (
            <select
              value={active}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              aria-label="플랜 선택"
              className="size-full appearance-none bg-transparent text-center px-8 cursor-pointer focus:outline-none"
            >
              {safePlans.map((p, i) => (
                <option key={i} value={i}>{p.planName || `플랜 ${i + 1}`}</option>
              ))}
            </select>
          ) : (
            <div className="flex size-full items-center justify-center px-8 truncate">{plan.planName || "기본 플랜"}</div>
          )}
          {showTabs && <IoChevronDownOutline className="absolute right-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none" />}
        </div>

        {/* 가격과 설명 사이 간격을 줄여 한 덩어리로 읽히게 한다 */}
        <div className="flex flex-col gap-5">
          <h3 className="px-2.5 text-xl font-semibold text-black">{displayPrice}</h3>
          {(plan.description || plan.items.length > 0) && (
            <div className="flex flex-col gap-2 py-1 font-medium">
              {plan.description && (
                <p className="text-black whitespace-pre-line">{plan.description}</p>
              )}
              {plan.items.length > 0 && (
                <ul className="flex flex-col list-disc pl-6 text-[#838383]">
                  {plan.items.map((item, i) => (
                    <li key={i}>{item.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {showInquiry && (
        <InquiryButton username={username} postId={postId} plans={safePlans} className={inquiryClassName} />
      )}
    </div>
  )
}
