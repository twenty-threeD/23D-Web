import { StarIcon } from "@/src/components/main/icons";
import Link from "next/link";
import { toRelativeUrl } from "@/src/lib/file";
import { getPostMainImage, type Post } from "@/src/lib/post";
import { parsePostContent } from "@/src/types/priceCard";

export function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col shrink-0 w-[260px] gap-4 animate-pulse">
      <div className="h-[180px] rounded-xl bg-zinc-200" />
      <div className="h-5 w-32 bg-zinc-200 rounded" />
      <div className="h-3.5 w-full bg-zinc-200 rounded" />
      <div className="h-3 w-4/5 bg-zinc-200 rounded" />
      <div className="h-9 rounded-lg bg-zinc-200" />
    </div>
  );
}

export default function ServiceCard({ post }: { post: Post }) {
  const image = getPostMainImage(post.fileUrls);
  const { description, plans } = parsePostContent(post.content);
  const rawPrice = plans[0]?.price;
  const price = rawPrice ? `${Number(String(rawPrice).replace(/,/g, "")).toLocaleString()}원 ~` : null;

  return (
    <div className="flex flex-col shrink-0 w-[260px] h-[360px] justify-between">
      <Link href={`/item/${post.id}`} className="flex flex-col gap-4 group">
        <div className="h-[180px] rounded-xl bg-zinc-200 overflow-hidden">
          {image && (
            <img
              src={toRelativeUrl(image)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xl font-semibold text-ink line-clamp-1">{post.title}</h3>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-ink-sub">
              <StarIcon className="size-3.5" />
              <span>{(0).toFixed(1)}</span>
            </div>
            {price && <span className="font-medium text-ink">{price}</span>}
          </div>
          <p className="font-medium text-ink-sub line-clamp-3">{description || post.content}</p>
        </div>
      </Link>
      {post.category && (
        <Link
          href={`/main?category=${post.category.id}`}
          className="flex items-center justify-center h-9 rounded-lg border border-ink-muted font-medium text-ink hover:bg-zinc-50 transition-colors"
        >
          {post.category.name} 관련 더보기
        </Link>
      )}
    </div>
  );
}
