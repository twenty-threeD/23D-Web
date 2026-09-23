"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SearchIcon } from "@/src/components/main/icons";
import AdCard, { AdCardSkeleton } from "@/src/components/main/AdCard";
import ServiceSection, { CardRow, MoreLink, Empty, SECTION_INSET } from "@/src/components/main/ServiceSection";
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

  // 시안처럼 카드 줄이 화면 오른쪽 밖으로 이어져야 넘길 거리가 생긴다.
  // 3~4장만 두면 화면에 거의 다 들어와 좌우 이동이 사실상 안 되므로 줄마다 넉넉히 채운다
  const adPosts = posts.slice(0, 8);
  const popularPosts = posts.slice(0, 10);
  const revisitPosts = [...posts.slice(4), ...posts.slice(0, 4)].slice(0, 10);

  return (
    <div className="flex flex-col items-center gap-20 pt-[120px] pb-24 overflow-x-hidden">
      {/* 검색 + 카테고리 */}
      <section className="flex flex-col items-center gap-9 w-full max-w-[960px] px-5">
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
              <SearchIcon className="size-full" />
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
      <section className={`flex flex-col gap-5 w-full ${SECTION_INSET}`}>
        <CardRow
          gap="gap-[26px]"
          header={
            <div className="flex items-end gap-3">
              <h2 className="text-[28px] font-semibold text-ink leading-none">광고</h2>
              <MoreLink />
            </div>
          }
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <AdCardSkeleton key={i} />)
            : adPosts.length > 0
              ? adPosts.map((post) => <AdCard key={post.id} post={post} />)
              : <Empty />}
        </CardRow>
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
