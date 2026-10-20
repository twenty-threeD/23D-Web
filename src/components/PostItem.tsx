import Image from "next/image"
import Link from "next/link";
import { toRelativeUrl } from "@/src/lib/file"

function extractFirstImage(text: string): string | undefined {
  const match = text.match(/!\[.*?\]\((.*?)\)/)
  return match ? match[1] : undefined
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .trim()
}

interface PostItemProps {
  id: number
  title: string
  content: string
  imageUrl?: string
  createdAt: string
}

export default function PostItem({ id, title, content = "", imageUrl, createdAt }: PostItemProps) {
  const thumbnail = toRelativeUrl(imageUrl) || extractFirstImage(content)

  return (
    <Link href={`/posts/${id}`} className="flex flex-col gap-2 justify-between items-center shrink-0 py-4">
      <div className="flex justify-between gap-4 w-full">
        <div className="flex flex-col gap-2 min-w-0">
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
          <p className="text-zinc-500 line-clamp-2">{stripMarkdown(content)}</p>
        </div>

        {/* 휴대폰은 폭이 좁아 사진이 없는 글까지 자리를 비워두면 제목이 잘게 꺾인다. 사진이 있을 때만 작게 둔다 */}
        <div className={`relative ${thumbnail ? "block" : "hidden md:block"} size-20 md:size-32 rounded-lg shrink-0 overflow-hidden bg-white`}>
          {thumbnail && (
            <Image src={thumbnail} alt="" fill sizes="(max-width: 767px) 80px, 128px" className="object-cover" />
          )}
        </div>
      </div>
      <div className="w-full flex justify-end items-center">
        <p className="text-zinc-500 text-sm font-semibold">{createdAt}</p>
      </div>
    </Link>
  );
}
