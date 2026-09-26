import Image from "next/image"
import { StarIcon } from "@/src/components/main/icons";
import Link from "next/link";
import { toRelativeUrl } from "@/src/lib/file";
import { getPostMainImage, type Post } from "@/src/lib/post";
import { parsePostContent } from "@/src/types/priceCard";

export function AdCardSkeleton() {
  return (
    <div className="flex flex-col shrink-0 w-[360px] h-[300px] rounded-[10px] bg-[#f7f7f7] overflow-hidden animate-pulse">
      <div className="h-40 bg-zinc-200" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-40 bg-zinc-200 rounded" />
        <div className="h-3 w-full bg-zinc-200 rounded" />
        <div className="h-3 w-3/4 bg-zinc-200 rounded" />
      </div>
    </div>
  );
}

export default function AdCard({ post }: { post: Post }) {
  const image = getPostMainImage(post.fileUrls);
  const description = parsePostContent(post.content).description || post.content;

  return (
    <Link
      href={`/item/${post.id}`}
      className="flex flex-col shrink-0 w-[360px] h-[300px] rounded-[10px] bg-[#f7f7f7] overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="relative h-40 bg-zinc-200">
        {image && (
          <Image src={toRelativeUrl(image)} alt={post.title} fill sizes="360px" className="object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink line-clamp-1">{post.title}</h3>
          <div className="flex items-center gap-1.5 shrink-0 text-sm text-ink-sub">
            <StarIcon className="size-3.5" />
            <span>{(0).toFixed(1)}</span>
          </div>
        </div>
        <p className="text-sm font-medium text-ink-sub line-clamp-4">{description}</p>
      </div>
    </Link>
  );
}
