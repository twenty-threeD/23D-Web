"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IoChevronDownOutline } from "react-icons/io5"
import { useAuthStore } from "@/src/store/authStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
import { createChatRoom } from "@/src/lib/chat"
import { useHandleError } from "@/src/hooks/useHandleError"
import { type PriceCardPlan } from "@/src/types/priceCard"
import ServicePickerModal from "@/src/components/item/ServicePickerModal"
import { signinPath } from "@/src/lib/navigation"

const DEFAULT_PLAN: PriceCardPlan = {
  planName: "기본 플랜",
  price: "",
  description: "",
  items: [],
}

interface PriceCardProps {
  username?: string
  plans?: PriceCardPlan[]
  postId?: number
  /** 문의하기 버튼 노출 여부. 결제 페이지처럼 이미 문의를 마친 화면에서는 끈다 */
  showInquiry?: boolean
  /** 지정하면 탭 없이 이 플랜만 보여준다. 결제 화면처럼 선택이 이미 끝난 경우에 쓴다 */
  selectedPlanName?: string | null
}

export default function PriceCard({ username, plans, postId, showInquiry = true, selectedPlanName }: PriceCardProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const handleError = useHandleError()
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const setSelectedService = useChatRoomsStore((s) => s.setSelectedService)

  const allPlans = plans && plans.length > 0 ? plans : [DEFAULT_PLAN]
  // 선택이 끝난 화면에서는 고른 플랜만 남긴다. 이름이 안 맞으면 전체를 그대로 둔다.
  const picked = selectedPlanName
    ? allPlans.filter((p) => p.planName === selectedPlanName)
    : []
  const safePlans = picked.length > 0 ? picked : allPlans
  const showTabs = safePlans.length > 1
  const active = Math.min(activeIndex, safePlans.length - 1)
  const plan = safePlans[active]

  async function handleSelectService(service: { planName: string; price: string }) {
    if (!token) { router.push(signinPath()); return }
    if (!username || !postId) return
    setLoading(true)
    try {
      const res = await createChatRoom(token, username, postId)
      const roomId = res.data?.roomId
      if (roomId) {
        setSelectedService(roomId, service, !res.data?.existingRoom)
        router.push(`/chat/${roomId}`)
      }
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
      setShowPicker(false)
    }
  }

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
        <button
          onClick={() => setShowPicker(true)}
          disabled={loading || !username}
          className="w-full h-[38px] text-center bg-main text-white font-semibold rounded-lg transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "연결 중..." : "문의하기"}
        </button>
      )}

      {showPicker && (
        <ServicePickerModal
          plans={safePlans}
          busy={loading}
          onClose={() => setShowPicker(false)}
          onSelect={handleSelectService}
        />
      )}
    </div>
  )
}
