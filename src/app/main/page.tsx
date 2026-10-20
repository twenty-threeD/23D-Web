"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SearchIcon } from "@/src/components/main/icons";
import AdCard, { AdCardSkeleton } from "@/src/components/main/AdCard";
import ServiceSection, { CardRow, MoreLink, Empty, SECTION_INSET } from "@/src/components/main/ServiceSection";
import { getPosts, searchPosts, searchPostsPaged, getPostCategories, CATEGORIES, type Post, type PostCategory } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";
import { PAGE_Y } from "@/src/lib/layout";

function MainContent() {
  const token = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const categoryParam = searchParams.get("category");
  const categoryIds = categoryParam ? categoryParam.split(",").map(Number) : null;
  const [searchValue, setSearchValue] = useState(keyword);
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [revisitPosts, setRevisitPosts] = useState<Post[]>([]);
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

  // 기본 목록은 최신 20개뿐이라 그 안에서 줄 세우면 전체에서 상위인 글이 빠진다.
  // 서버 정렬로 따로 받아 전체 기준 상위를 보여준다
  useEffect(() => {
    const fetchTop = (sort: string, set: (list: Post[]) => void) =>
      searchPostsPaged({ title: keyword, sort, page: 0, size: 20 })
        .then(({ posts: list }) => {
          const filtered = categoryIds ? list.filter((p) => p.category && categoryIds.includes(p.category.id)) : list;
          set(filtered.slice(0, 10));
        })
        .catch(() => set([]));

    fetchTop("viewCount,desc", setPopularPosts);
    // 재구매율(같은 갑이 두 번 이상 결제한 비율) 순. 구매자가 적은 글의 왜곡 보정과
    // 동률 시 조회수 순 정렬은 서버가 맡는다
    fetchTop("repeatRate,desc", setRevisitPosts);
  }, [keyword, categoryParam]);

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

  return (
    <div className={`flex flex-col items-center gap-14 md:gap-20 ${PAGE_Y} overflow-x-hidden`}>
      {/* 검색 + 카테고리 */}
      <section className="flex flex-col items-center gap-9 w-full max-w-[960px] px-5">
        <h1 className="text-center text-xl md:text-[28px] font-semibold text-ink leading-tight">
          블록체인 기반 용역 중개 플랫폼, <span className="text-2xl md:text-[32px] font-bold text-main">잇다</span>에서
          <br />
          필요한 순간, 필요한 능력자를 만나보세요.
        </h1>
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex items-center gap-3 w-full h-[52px] px-6 rounded-xl border border-line focus-within:border-main transition-colors">
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
          {/* 칩 너비가 글자 수마다 달라 폰에서는 3·3·2 로 들쭉날쭉하게 끊기고 화면 절반을 차지했다.
              8개를 같은 너비 4칸 × 2줄로 맞추고, 8개가 한 줄에 다 들어가는 lg 부터 기존 모양으로 둔다
              (태블릿 폭에서는 기존 모양이 6·2 로 끊긴다) */}
          <div className="grid w-full grid-cols-4 gap-2 md:gap-3 lg:flex lg:flex-wrap lg:justify-center lg:gap-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={categoryHref(c.name)}
                className="py-2.5 md:py-3 lg:px-[18px] rounded-[21px] border border-line text-center text-[13px] md:text-base whitespace-nowrap font-semibold leading-none text-[#838383] hover:border-main hover:text-main transition-colors"
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
          autoSlideMs={5000}
          snapMobile
          loopMobile={!loading && adPosts.length > 1}
          header={
            <div className="flex items-end gap-3">
              <h2 className="text-2xl md:text-[28px] font-semibold text-ink leading-none">광고</h2>
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
