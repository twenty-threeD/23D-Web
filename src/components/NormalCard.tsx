import Image from "next/image"
import Link from "next/link";
import { FaStar } from "react-icons/fa"
import { toRelativeUrl } from "@/src/lib/file"
import { parsePostContent } from "@/src/types/priceCard"
import { cardClasses } from "@/src/components/main/ServiceCard"

interface NormalCardProps {
  id: number
  title: string
  content: string
  fileUrl?: string
  price?: string
  rating?: number
  category?: { id: number; name: string } | null
  /** 휴대폰 목록 그리드에서 칸 폭에 맞춰 늘린다. 가로 스크롤 줄에서는 끈다 */
  inGrid?: boolean
}

function getDescription(content: string): string {
  return parsePostContent(content).description || content
}

function getPrice(content: string, fallback?: string): string | null {
  const { plans } = parsePostContent(content)
  const price = plans[0]?.price || fallback
  return price ? `${Number(String(price).replace(/,/g, "")).toLocaleString()}원 ~` : null
}

export default function NormalCard({ id, title, content, fileUrl, price, rating, category, inGrid = false }: NormalCardProps) {
  const c = cardClasses(inGrid)
  const description = getDescription(content)
  const displayPrice = getPrice(content, price)

  // 메인 ServiceCard 와 같은 시안(4147:3815)을 따른다. 설명 길이가 달라도 버튼 위치가 맞도록 높이를 고정한다
  return (
    <div className={`flex flex-col shrink-0 ${c.root} justify-between`}>
      <Link href={`/item/${id}`} className="flex flex-col gap-4 group">
        <div className={`relative ${c.image} rounded-xl bg-zinc-200 overflow-hidden`}>
          {fileUrl && (
            <Image
              src={toRelativeUrl(fileUrl)}
              alt={title}
              fill
              sizes={c.sizes}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className={`${c.title} font-semibold text-ink line-clamp-1`}>{title}</h3>
          <div className={`flex items-center justify-between ${c.meta}`}>
            <div className="flex items-center gap-1.5 text-ink-sub">
              <FaStar className="text-main text-xs" />
              <span>{(rating ?? 0).toFixed(1)}</span>
            </div>
            {displayPrice && <span className="font-medium text-ink">{displayPrice}</span>}
          </div>
          {/* 공백 없는 긴 문자열(태그 나열·URL)은 줄바꿈이 안 돼 2줄 말줄임이 깨지므로 글자 단위로 끊는다 */}
          <p className={`${c.description} font-medium text-ink-sub line-clamp-2 break-all`}>{description}</p>
        </div>
      </Link>
      {category && (
        <Link
          href={`/main?category=${category.id}`}
          className={`flex items-center justify-center ${c.more} rounded-lg border border-ink-muted font-medium text-ink hover:bg-zinc-50 transition-colors`}
        >
          {category.name} 관련 더보기
        </Link>
      )}
    </div>
  );
}
