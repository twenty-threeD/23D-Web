import PostImage from "@/src/components/PostImage"
import { StarIcon } from "@/src/components/main/icons";
import Link from "next/link";
import { getPostMainImage, type Post } from "@/src/lib/post";
import { parsePostContent } from "@/src/types/priceCard";
import PostRating from "@/src/components/main/PostRating";

// 가로 스크롤 줄에서는 시안 폭(260px)을 그대로 쓰고, 휴대폰 목록 그리드(inGrid)에서는 두 칸에 맞춰 늘린다.
// 목록 그리드도 sm(640px)부터는 다시 260px 칸이라 그때부터는 줄과 같은 모양이다.
// Tailwind 는 소스에 그대로 적힌 클래스만 만들어서 문자열을 조합하지 않고 통째로 적는다
export function cardClasses(inGrid = false) {
  return inGrid
    ? {
        root: "w-full sm:w-[260px] sm:h-[360px] gap-3 sm:gap-0",
        image: "aspect-[13/9] sm:aspect-auto sm:h-[180px]",
        title: "text-base sm:text-xl",
        meta: "text-xs sm:text-sm",
        description: "text-sm sm:text-base",
        more: "h-8 sm:h-9 text-xs sm:text-base",
        sizes: "(max-width: 639px) 50vw, 260px",
      }
    : {
        root: "w-[260px] h-[360px]",
        image: "h-[180px]",
        title: "text-xl",
        meta: "text-sm",
        description: "",
        more: "h-9",
        sizes: "260px",
      }
}

// 실제 카드와 같은 크기 클래스·같은 줄 높이로 자리를 잡아, 불러온 뒤에 카드 높이가 바뀌어 아래가 밀리지 않게 한다.
// 막대는 글자 줄(line-height) 높이의 칸 안에 가운데 두어 글자처럼 보이게 한다
export function ServiceCardSkeleton({ inGrid = false }: { inGrid?: boolean }) {
  const c = cardClasses(inGrid);
  const line = (height: string, bar: string) => (
    <div className={`flex items-center ${height}`}>
      <div className={`rounded bg-zinc-200 ${bar}`} />
    </div>
  );
  return (
    <div className={`flex flex-col shrink-0 ${c.root} justify-between animate-pulse`}>
      <div className="flex flex-col gap-4">
        <div className={`${c.image} rounded-xl bg-zinc-200`} />
        <div className="flex flex-col gap-1.5">
          {inGrid ? line("h-6 sm:h-7", "h-4 sm:h-5 w-3/4") : line("h-7", "h-5 w-3/4")}
          {inGrid ? line("h-4 sm:h-5", "h-3 w-full") : line("h-5", "h-3.5 w-full")}
          <div className="flex flex-col">
            {inGrid ? line("h-5 sm:h-6", "h-3 sm:h-3.5 w-full") : line("h-6", "h-3.5 w-full")}
            {inGrid ? line("h-5 sm:h-6", "h-3 sm:h-3.5 w-4/5") : line("h-6", "h-3.5 w-4/5")}
          </div>
        </div>
      </div>
      <div className={`${c.more} rounded-lg bg-zinc-200`} />
    </div>
  );
}

export default function ServiceCard({ post, inGrid = false }: { post: Post; inGrid?: boolean }) {
  const c = cardClasses(inGrid);
  const image = getPostMainImage(post.fileUrls);
  const { description, plans } = parsePostContent(post.content);
  const rawPrice = plans[0]?.price;
  const price = rawPrice ? `${Number(String(rawPrice).replace(/,/g, "")).toLocaleString()}원 ~` : null;

  return (
    <div className={`flex flex-col shrink-0 ${c.root} justify-between`}>
      <Link href={`/item/${post.id}`} className="flex flex-col gap-4 group">
        <div className={`relative ${c.image} rounded-xl bg-zinc-200 overflow-hidden`}>
          {image && (
            <PostImage
              src={image}
              alt={post.title}
              fill
              sizes={c.sizes}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className={`${c.title} font-semibold text-ink line-clamp-1`}>{post.title}</h3>
          <div className={`flex items-center justify-between ${c.meta}`}>
            <div className="flex items-center gap-1.5 text-ink-sub">
              <StarIcon className="size-3.5" />
              <PostRating postId={post.id} />
            </div>
            {price && <span className="font-medium text-ink">{price}</span>}
          </div>
          {/* 공백 없는 긴 문자열(태그 나열·URL)은 줄바꿈이 안 돼 2줄 말줄임이 깨지므로 글자 단위로 끊는다 */}
          <p className={`${c.description} font-medium text-ink-sub line-clamp-2 break-all`}>{description || post.content}</p>
        </div>
      </Link>
      {post.category && (
        <Link
          href={`/main?category=${post.category.id}`}
          className={`flex items-center justify-center ${c.more} rounded-lg border border-ink-muted font-medium text-ink hover:bg-zinc-50 transition-colors`}
        >
          {post.category.name} 관련 더보기
        </Link>
      )}
    </div>
  );
}
