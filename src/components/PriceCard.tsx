"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
}

export default function PriceCard({ username, plans, postId, showInquiry = true }: PriceCardProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const handleError = useHandleError()
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const setSelectedService = useChatRoomsStore((s) => s.setSelectedService)

  const safePlans = plans && plans.length > 0 ? plans : [DEFAULT_PLAN]
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

  return (
    <div className="grow flex flex-col gap-2 border border-zinc-300 rounded-lg sticky top-24 self-start">
      {/* Header */}
      <div className="flex border-b border-zinc-300 h-12 font-medium">
        {safePlans.map((p, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`flex items-center justify-center flex-1 py-2 border-b-2 font-semibold text-sm px-4 truncate cursor-pointer ${
              i === active ? "border-main text-main" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {p.planName || `플랜 ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 py-4 px-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">{displayPrice}</h3>
          <h4 className="text-lg font-semibold">{plan.planName}</h4>
          {plan.description && (
            <span className="text-sm text-zinc-400 whitespace-pre-line">{plan.description}</span>
          )}
        </div>

        {plan.items.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {plan.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                <span className="text-sm text-zinc-400">{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {showInquiry && (
          <button
            onClick={() => setShowPicker(true)}
            disabled={loading || !username}
            className="w-full py-3 text-center bg-main text-white text-sm font-semibold rounded-xl transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "연결 중..." : "문의하기"}
          </button>
        )}
      </div>

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
