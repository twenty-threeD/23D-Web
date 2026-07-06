import Link from "next/link";
import { FaStar } from "react-icons/fa"

interface NormalCardProps {
  id: number
  title: string
  content: string
  fileUrl?: string
  price?: string
  rating?: number
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

export default function NormalCard({ id, title, content, fileUrl, price, rating }: NormalCardProps) {
  const description = getDescription(content)
  const displayPrice = getPrice(content, price)

  return (
    <Link href={`/item/${id}`} className="flex flex-col w-64 gap-2 p-3 rounded-lg hover:scale-105 hover:shadow-lg transition-transform duration-300">
      <div className="h-48 rounded-lg bg-zinc-300 overflow-hidden border-zinc-100 border">
        {fileUrl ? (
          <img src={fileUrl} alt={title} className="w-full h-full object-cover" />
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
  );
}
