"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/src/store/authStore"
import { createChatRoom } from "@/src/lib/chat"
import { useHandleError } from "@/src/hooks/useHandleError"
import { type PriceCardPlan } from "@/src/types/priceCard"

const DEFAULT_PLAN: PriceCardPlan = {
  planName: "기본 플랜",
  price: "",
  description: "",
  items: [],
}

interface PriceCardProps {
  username?: string
  plan?: PriceCardPlan
  postId?: number
}

export default function PriceCard({ username, plan = DEFAULT_PLAN, postId }: PriceCardProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const handleError = useHandleError()
  const [loading, setLoading] = useState(false)

  async function handleChat() {
    if (!token) { router.push("/login/signin"); return }
    if (!username) return
    setLoading(true)
    try {
      const res = await createChatRoom(token, username)
      const roomId = res.data?.roomId
      if (roomId) router.push(`/chat/${roomId}`)
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
    }
  }

  const displayPrice = plan.price
    ? `${Number(plan.price.replace(/,/g, '')).toLocaleString()}원`
    : "가격 미정"

  return (
    <div className="grow flex flex-col gap-2 border border-zinc-300 rounded-lg sticky top-24 self-start">
      {/* Header */}
      <div className="flex border-b border-zinc-300 h-12 font-medium">
        <div className="flex items-center justify-center w-full py-2 border-b-2 font-semibold text-sm px-4 truncate">
          {plan.planName || "서비스 플랜"}
        </div>
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
          <div className="flex flex-col items-center gap-1">
            {plan.items.map((item, i) => (
              <div key={i} className="flex justify-between w-full">
                <span className="text-sm text-zinc-400">{item.name}</span>
                <span className="text-sm text-zinc-400">{item.included ? "O" : "X"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link
            href={postId ? `/pay/${postId}` : "/pay"}
            className="w-full py-2 border text-center border-zinc-300 font-semibold rounded-md"
          >
            견적서 요청
          </Link>
          <button
            onClick={handleChat}
            disabled={loading || !username}
            className="w-full py-2 border text-center bg-main border-zinc-300 text-white font-semibold rounded-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? "연결 중..." : "문의하기"}
          </button>
        </div>
      </div>
    </div>
  )
}
