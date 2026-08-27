import Link from "next/link"
import { IoLocationOutline, IoCalendarOutline, IoPricetagOutline } from "react-icons/io5"
import { toRelativeUrl } from "@/src/lib/file"
import { parseJobContent, formatBudget, formatDesiredDate } from "@/src/types/jobPost"

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

interface JobPostItemProps {
  id: number
  title: string
  content: string
  imageUrl?: string
  createdAt: string
}

export default function JobPostItem({ id, title, content = "", imageUrl, createdAt }: JobPostItemProps) {
  const job = parseJobContent(content)
  const thumbnail = toRelativeUrl(imageUrl) || extractFirstImage(job.description)

  return (
    <Link href={`/jobs/post/${id}`} className="flex flex-col gap-2 justify-between items-center shrink-0 py-4">
      <div className="flex justify-between w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {job.categoryName && (
              <span className="text-xs font-semibold text-main border border-main rounded-full px-2 py-0.5 shrink-0">
                {job.categoryName}
              </span>
            )}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <p className="text-zinc-500 line-clamp-2">{stripMarkdown(job.description)}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            {job.budget && (
              <span className="flex items-center gap-1">
                <IoPricetagOutline /> 희망가 {formatBudget(job.budget)}
              </span>
            )}
            {job.desiredDate && (
              <span className="flex items-center gap-1">
                <IoCalendarOutline /> {formatDesiredDate(job.desiredDate)}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <IoLocationOutline /> {job.location}
              </span>
            )}
          </div>
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
  )
}
