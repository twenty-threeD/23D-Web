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

function formatDate(value?: string | null) {
  if (!value) return "작성일 미상";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR");
}

export default function Review({ review }: ReviewProps) {
  const authorName = review.author?.name || review.author?.username || "익명 사용자";
  const profileImage = review.author?.imageUrl ? toRelativeUrl(review.author.imageUrl) : "/profile.png";

  return (
    <article className="flex gap-3 py-4 border-b border-zinc-100 last:border-b-0">
      <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-300 shrink-0 bg-zinc-100">
        <img src={profileImage} alt="프로필사진" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-md font-bold">{maskName(authorName)}</h3>
          {review.categoryName && <span className="text-sm font-medium text-zinc-500">{review.categoryName}</span>}
          <StarRating rating={review.rating} size="sm" />
          <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
        </div>

        <p className="text-sm text-zinc-600 font-medium whitespace-pre-line break-words">{review.content}</p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-400">{formatDate(review.createdAt)}</span>
          {review.workDays != null && <span className="text-sm font-medium text-zinc-400">작업일: {review.workDays}일</span>}
          {review.priceRange && <span className="text-sm font-medium text-zinc-400">주문금액: {review.priceRange}</span>}
        </div>
      </div>
    </article>
  )
}
