import Link from "next/link";
import { FaStar } from "react-icons/fa"
import { toRelativeUrl } from "@/src/lib/file"

interface NormalCardProps {
  id: number
  title: string
  content: string
  fileUrl?: string
  price?: string
  rating?: number
  category?: { id: number; name: string } | null
}

function getDescription(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return parsed.description ?? content
  } catch {
    return content
  }
}

function getPrice(content: string, fallback?: string): string | null {
  try {
    const parsed = JSON.parse(content)
    const price = parsed.plan?.price || fallback
    return price ? `${Number(String(price).replace(/,/g, "")).toLocaleString()}원 ~` : null
  } catch {
    return fallback ? `${Number(String(fallback).replace(/,/g, "")).toLocaleString()}원 ~` : null
  }
}

export default function NormalCard({ id, title, content, fileUrl, price, rating, category }: NormalCardProps) {
  const description = getDescription(content)
  const displayPrice = getPrice(content, price)

  return (
    <div className="flex flex-col w-64 gap-2 p-3 rounded-lg hover:shadow-sm transition-transform duration-300">
      <Link href={`/item/${id}`} className="flex flex-col gap-2">
        <div className="h-48 rounded-lg bg-zinc-300 overflow-hidden border-zinc-100 border">
          {fileUrl ? (
            <img src={toRelativeUrl(fileUrl)} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-300 overflow-hidden" />
          )}
        </div>
        <h3 className="text-xl pt-2 font-semibold line-clamp-1">{title}</h3>
        <div className="flex justify-between items-center text-zinc-500">
          <div className="flex items-center gap-1">
            <FaStar className="text-main text-xs" />
            <span className="text-sm">{(rating ?? 0).toFixed(1)}</span>
          </div>
          {displayPrice && <p className="font-medium">{displayPrice}</p>}
        </div>
        <p className="font-medium text-zinc-500 line-clamp-2">{description}</p>
      </Link>
      {category && (
        <Link
          href={`/main?category=${category.id}`}
          className="text-sm text-zinc-400 hover:text-main transition-colors"
        >
          {category.name} 관련 더보기
        </Link>
      )}
    </div>
  );
}
