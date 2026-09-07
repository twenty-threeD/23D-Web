"use client"

import Link from "next/link"
import { IoChatbubbleOutline, IoChevronForward, IoImageOutline } from "react-icons/io5"
import { toRelativeUrl } from "@/src/lib/file"

interface ChatStartCardProps {
  postId?: number | null
  postTitle?: string | null
  imageUrl?: string | null
  /** 대화 상대 이름 */
  partnerName?: string | null
  /** 문의할 때 고른 서비스 플랜 */
  planName?: string | null
  price?: string | null
}

function formatPrice(price?: string | null) {
  if (!price) return null
  const digits = price.replace(/[^0-9]/g, "")
  if (!digits) return null
  return `${Number(digits).toLocaleString()}원`
}

// 문의하기로 채팅방이 만들어질 때 한 번 깔리는 안내 카드.
// 말풍선이 아니라 "잇다가 보낸 시스템 안내"로 읽히도록 상단에 발신 라벨을 둔다.
export default function ChatStartCard({
  postId,
  postTitle,
  imageUrl,
  partnerName,
  planName,
  price,
}: ChatStartCardProps) {
  const formattedPrice = formatPrice(price)

  return (
    <div className="animate-chat-card mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
        <IoChatbubbleOutline className="shrink-0 text-sm text-zinc-400" />
        <span className="text-[11.5px] font-medium tracking-wide text-zinc-400">잇다 시스템 안내</span>
      </div>

      <div className="flex gap-4 px-4 py-4.5">
        {imageUrl ? (
          <div className="size-22 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200">
            <img src={toRelativeUrl(imageUrl)} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="flex size-22 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-100">
            <IoImageOutline className="text-xl text-zinc-300" />
            <span className="text-[10px] text-zinc-400">이미지 없음</span>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="text-[14.5px] leading-relaxed text-zinc-700">
            {partnerName ? `${partnerName}님과 ` : ""}
            <strong className="font-semibold text-zinc-900">{postTitle ?? "이 서비스"}</strong>
            에 대한 이야기를 시작해보세요.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {planName && (
              <span className="max-w-full truncate rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11.5px] font-medium text-zinc-600">
                {planName}
              </span>
            )}
            {formattedPrice && (
              <span className="text-lg font-bold tracking-tight text-zinc-900">{formattedPrice}</span>
            )}
          </div>
        </div>
      </div>

      {postId ? (
        <Link
          href={`/item/${postId}`}
          className="flex items-center justify-center gap-1.5 border-t border-zinc-100 py-3.5 text-[13px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-main"
        >
          상품상세 보기
          <IoChevronForward className="text-sm" />
        </Link>
      ) : null}
    </div>
  )
}
