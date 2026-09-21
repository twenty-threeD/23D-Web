"use client";

import { useEffect, useRef, useState, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdCard, { AdCardSkeleton } from "@/src/components/main/AdCard";
import ServiceCard, { ServiceCardSkeleton } from "@/src/components/main/ServiceCard";
import { getPosts, searchPosts, getPostCategories, type Post, type PostCategory } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";

// 시안의 카테고리 표기(`이사 | 청소`)와 서버 카테고리명(`이사/청소`)이 달라 이름을 따로 둔다
const CATEGORIES: { label: string; name: string }[] = [
  { label: "이사 | 청소", name: "이사/청소" },
  { label: "설치 | 수리", name: "설치/수리" },
  { label: "인테리어", name: "인테리어" },
  { label: "외주", name: "외주" },
  { label: "법률 | 금융", name: "법률/금융" },
  { label: "과외", name: "과외" },
  { label: "자동차", name: "자동차" },
  { label: "기타", name: "기타" },
];

function MoreLink() {
  return (
    <Link href="/more" className="text-sm font-medium text-ink-muted underline hover:text-main transition-colors">
      더보기
    </Link>
  );
}

// 카드 줄은 가로 스크롤로 넘기고, 시안의 좌우 화살표 아이콘(한 장짜리 svg) 위에 투명 버튼 두 개를 겹쳐 조작한다
function CardRow({ children, gap }: { children: ReactNode; gap: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-3">
      <div className="relative self-end w-16 h-6 shrink-0">
        <img src="/main/left-right.svg" alt="" className="size-full" />
        <button type="button" aria-label="이전" onClick={() => scroll(-1)} className="absolute left-0 top-0 size-6 cursor-pointer" />
        <button type="button" aria-label="다음" onClick={() => scroll(1)} className="absolute right-0 top-0 size-6 cursor-pointer" />
      </div>
      <div ref={ref} className={`flex ${gap} overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {children}
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-ink-muted py-10">등록된 항목이 없습니다</p>;
}

function ServiceSection({ title, loading, posts }: { title: [string, string]; loading: boolean; posts: Post[] }) {
  return (
    <section className="flex gap-12 w-full">
      <div className="flex flex-col gap-3 shrink-0 w-32 pt-2.5">
        <h2 className="text-[28px] font-bold text-ink leading-tight">
          {title[0]}<br />{title[1]}
        </h2>
        <div className="flex"><MoreLink /></div>
      </div>
      <CardRow gap="gap-9">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : posts.length > 0
            ? posts.map((post) => <ServiceCard key={post.id} post={post} />)
            : <Empty />}
      </CardRow>
    </section>
  );
}

function MainContent() {
  const token = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const categoryParam = searchParams.get("category");
  const categoryIds = categoryParam ? categoryParam.split(",").map(Number) : null;
  const [searchValue, setSearchValue] = useState(keyword);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PostCategory[]>([]);

  useEffect(() => {
    getPostCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const request = keyword ? searchPosts(keyword) : getPosts(token);
    request
      .then((list) => setPosts(categoryIds ? list.filter((p) => p.category && categoryIds.includes(p.category.id)) : list))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [token, keyword, categoryParam]);

  function categoryHref(name: string): string {
    const match = categories.find((c) => c.name === name);
    return match ? `/search?categoryId=${match.id}` : "/search";
  }

  function handleSearch() {
    if (searchValue.trim()) router.push(`/search?keyword=${encodeURIComponent(searchValue)}`);
    else router.push("/search");
  }

  const adPosts = posts.slice(0, 3);
  const popularPosts = posts.slice(0, 4);
  const revisitPosts = posts.slice(4, 8);

  return (
    <div className="flex flex-col items-center gap-20 px-5 md:px-10 xl:px-40 pt-[120px] pb-24">
      {/* 검색 + 카테고리 */}
      <section className="flex flex-col items-center gap-9 w-full max-w-[920px]">
        <h1 className="text-center text-[28px] font-semibold text-ink leading-tight">
          블록체인 기반 용역 중개 플랫폼, <span className="text-[32px] font-bold text-main">잇다</span>에서
          <br />
          필요한 순간, 필요한 능력자를 만나보세요.
        </h1>
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex items-center gap-3 w-full h-[52px] px-6 rounded-xl border border-[#b8b8b8] focus-within:border-main transition-colors">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="자동차 래핑, 에어컨 설치, 이사 인테리어... 어떤걸 찾고 있나요?"
              className="flex-1 min-w-0 font-medium text-ink placeholder:text-[#aaa] focus:outline-none"
            />
            <button type="button" aria-label="검색" onClick={handleSearch} className="size-6 shrink-0 cursor-pointer">
              <img src="/main/search.svg" alt="" className="size-full" />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={categoryHref(c.name)}
                className="px-[18px] py-3 rounded-[21px] border border-[#838383] font-semibold leading-none text-[#838383] hover:border-main hover:text-main transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 광고 */}
      <section className="flex flex-col gap-5 w-full">
        <div className="flex items-end gap-3">
          <h2 className="text-[28px] font-semibold text-ink leading-none">광고</h2>
          <MoreLink />
        </div>
        <div className="flex gap-[26px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <AdCardSkeleton key={i} />)
            : adPosts.length > 0
              ? adPosts.map((post) => <AdCard key={post.id} post={post} />)
              : <Empty />}
        </div>
      </section>

      <ServiceSection title={["이웃들이", "많이 찾아요"]} loading={loading} posts={popularPosts} />
      <ServiceSection title={["재방문율이", "높아요"]} loading={loading} posts={revisitPosts} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MainContent />
    </Suspense>
  );
}
