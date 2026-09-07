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
      <div className="flex justify-between w-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-zinc-500 line-clamp-2">{stripMarkdown(content)}</p>
        </div>

        <div className="w-32 h-32 rounded-lg shrink-0 ml-4 overflow-hidden bg-white">
          {thumbnail && (
            <img className="w-full h-full object-cover" src={thumbnail} alt="" />
          )}
        </div>
      </div>
      <div className="w-full flex justify-end items-center">
        <p className="text-zinc-500 text-sm font-semibold">{createdAt}</p>
      </div>
    </Link>
  );
}
