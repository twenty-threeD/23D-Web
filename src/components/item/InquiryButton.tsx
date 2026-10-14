"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/src/store/authStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
import { openChatRoomForPost } from "@/src/lib/chat"
import { useHandleError } from "@/src/hooks/useHandleError"
import { type PriceCardPlan, FALLBACK_PLAN } from "@/src/types/priceCard"
import ServicePickerModal from "@/src/components/item/ServicePickerModal"
import { signinPath } from "@/src/lib/navigation"

interface InquiryButtonProps {
  /** 글 작성자(을). 이 사람과의 채팅방을 연다 */
  username?: string
  postId?: number
  plans?: PriceCardPlan[]
  className?: string
}

// 문의하기: 플랜을 고르면 글 작성자와의 채팅방을 열고 고른 플랜을 넘긴다.
// 가격 카드 안의 버튼과 휴대폰 하단 고정 버튼이 같은 동작이라 한 곳에 둔다
export default function InquiryButton({ username, postId, plans, className = "" }: InquiryButtonProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const handleError = useHandleError()
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const setSelectedService = useChatRoomsStore((s) => s.setSelectedService)

  async function handleSelectService(service: { planName: string; price: string }) {
    if (!token) { router.push(signinPath()); return }
    if (!username || !postId) return
    setLoading(true)
    try {
      const res = await openChatRoomForPost(token, username, postId)
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

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        disabled={loading || !username}
        className={`w-full h-[38px] text-center bg-main text-white font-semibold rounded-lg transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer ${className}`}
      >
        {loading ? "연결 중..." : "문의하기"}
      </button>

      {showPicker && (
        <ServicePickerModal
          plans={plans && plans.length > 0 ? plans : [FALLBACK_PLAN]}
          busy={loading}
          onClose={() => setShowPicker(false)}
          onSelect={handleSelectService}
        />
      )}
    </>
  )
}
