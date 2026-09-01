import Link from "next/link";
import { toRelativeUrl } from "@/src/lib/file"

interface PremiumCardProps {
  id: number
  title: string
  content: string
  fileUrls?: string[]
}

function getDescription(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return parsed.description ?? content
  } catch {
    return content
  }
}

export default function PremiumCard({ id, title, content, fileUrls }: PremiumCardProps) {
  const description = getDescription(content)
  // 새 게시물은 [헤더, 메인, 상세...] 순서이므로 카드에는 메인 이미지를 우선 보여준다.
  const images = (fileUrls ?? []).length > 1
    ? (fileUrls ?? []).slice(1, 3)
    : (fileUrls ?? []).slice(0, 2)

  return (
    <Link href={`/item/${id}`} className="flex flex-col w-lg h-72 p-3 rounded-lg hover:shadow-sm transition-transform duration-300">
      <div className="w-full h-32 bg-zinc-300 flex items-center justify-start rounded-lg overflow-hidden">
        {images.length === 0 ? (
          <div className="w-full h-full bg-zinc-200" />
        ) : (
          images.map((url, i) => (
            <img
              key={i}
              src={toRelativeUrl(url)}
              alt={title}
              className={`h-full object-cover ${images.length === 1 ? "w-full" : "w-1/2"}`}
            />
          ))
        )}
      </div>
      <div className="flex flex-col gap-2 py-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg line-clamp-1">{title}</h2>
        </div>
        <p className="text-zinc-500 line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}
