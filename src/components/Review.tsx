import StarRating from "./StarRating"
import { toRelativeUrl } from "@/src/lib/file"
import type { Review as ReviewData } from "@/src/lib/review"

interface ReviewProps {
  review: ReviewData
}

function maskName(name: string) {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

// 시안이 날짜 대신 "1달전" 같은 상대 시간으로 표기한다
function formatRelative(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}달전`;
  return `${Math.floor(months / 12)}년전`;
}

export default function Review({ review }: ReviewProps) {
  const authorName = review.author?.name || review.author?.username || "익명 사용자";
  const profileImage = review.author?.imageUrl ? toRelativeUrl(review.author.imageUrl) : "/profile.png";
  const meta = [review.categoryName, formatRelative(review.createdAt)].filter(Boolean).join(" • ");

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-[52px] rounded-full overflow-hidden shrink-0 bg-zinc-100">
            <img src={profileImage} alt="프로필사진" className="size-full object-cover" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 font-medium text-ink-sub">
            <span className="text-xs">{maskName(authorName)}</span>
            {meta && <span className="truncate">{meta}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StarRating rating={review.rating} />
          <span className="text-xl font-medium text-black">{review.rating.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-xl leading-[25px] text-black whitespace-pre-line break-words">{review.content}</p>
    </article>
  )
}
