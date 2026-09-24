"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ServiceCard, { ServiceCardSkeleton } from "@/src/components/main/ServiceCard";
import { SearchIcon } from "@/src/components/main/icons";
import TopButton from "@/src/components/TopButton";
import { searchPostsPaged, getPostCategories, CATEGORIES, type Post, type PostCategory } from "@/src/lib/post";

const SORT_OPTIONS = [
  { label: "최신순", value: "updatedAt,desc" },
  { label: "조회순", value: "viewCount,desc" },
] as const;

const PAGE_SIZE = 20;

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId");
  const sort = searchParams.get("sort") ?? SORT_OPTIONS[0].value;

  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getPostCategories().then(setCategories).catch(() => {});
  }, []);

  // 조건이 바뀌면 첫 페이지부터 다시 불러온다
  useEffect(() => {
    searchPostsPaged({
      title: keyword,
      categoryId: categoryId ? Number(categoryId) : undefined,
      sort,
      page: 0,
      size: PAGE_SIZE,
    })
      .then((res) => {
        setPosts(res.posts);
        setTotal(res.totalElements);
        setPage(res.page);
        setIsLast(res.last);
      })
      .catch(() => {
        setPosts([]);
        setTotal(0);
        setIsLast(true);
      })
      .finally(() => setLoading(false));
  }, [keyword, categoryId, sort]);

  // 검색 조건을 URL 에 반영해 뒤로가기와 링크 공유가 되게 한다
  function updateQuery(next: { keyword?: string; categoryId?: string | null; sort?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    const apply = (key: string, value: string | null | undefined) => {
      if (value === undefined) return;
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    };

    apply("keyword", next.keyword);
    apply("categoryId", next.categoryId);
    apply("sort", next.sort);

    setLoading(true);
    router.push(`/search?${params.toString()}`);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const res = await searchPostsPaged({
        title: keyword,
        categoryId: categoryId ? Number(categoryId) : undefined,
        sort,
        page: page + 1,
        size: PAGE_SIZE,
      });
      setPosts((prev) => [...prev, ...res.posts]);
      setPage(res.page);
      setIsLast(res.last);
    } catch {
      setIsLast(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const [searchValue, setSearchValue] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);

  // 뒤로가기 등으로 URL 의 검색어가 바뀌면 입력창도 따라가게 한다.
  // effect 로 맞추면 한 번 더 렌더되므로 렌더 중에 이전 값과 비교해 바로 맞춘다
  if (syncedKeyword !== keyword) {
    setSyncedKeyword(keyword);
    setSearchValue(keyword);
  }

  // 카테고리 목록을 서버 응답 뒤에 그리면 처음엔 '전체'만 보여서, 메인처럼 고정 목록을 바로 그리고
  // 서버 id 는 클릭 시점에 찾는다. 응답 전에 눌리면 그 자리에서 한 번 더 받아온다
  async function selectCategory(name: string | null) {
    if (name === null) return updateQuery({ categoryId: null });
    const list = categories.length > 0 ? categories : await getPostCategories().catch(() => []);
    const id = list.find((category) => category.name === name)?.id;
    updateQuery({ categoryId: id !== undefined ? String(id) : null });
  }

  const chipClass = (active: boolean) =>
    `px-[18px] py-3 rounded-[21px] border font-semibold leading-none transition-colors cursor-pointer ${
      active ? "bg-main border-main text-white" : "border-[#838383] text-[#838383] hover:border-main hover:text-main"
    }`;

  return (
    <div>
      {/* 메인 검색 영역과 같은 시안이라 라운드·보더·간격을 메인 페이지와 맞췄다 */}
      <main className="flex flex-col items-center gap-[120px] px-5 pt-[120px] pb-[120px]">
        <section className="flex flex-col items-center gap-6 w-full max-w-[920px]">
          <div className="flex items-center gap-3 w-full h-[52px] px-6 rounded-xl border border-[#b8b8b8] focus-within:border-main transition-colors">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateQuery({ keyword: searchValue.trim() })}
              placeholder="어떤 능력자를 찾고 계신가요?"
              className="flex-1 min-w-0 font-medium text-ink placeholder:text-[#aaa] focus:outline-none"
            />
            <button
              type="button"
              aria-label="검색"
              onClick={() => updateQuery({ keyword: searchValue.trim() })}
              className="size-6 shrink-0 cursor-pointer"
            >
              <SearchIcon className="size-full" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <button type="button" onClick={() => selectCategory(null)} className={chipClass(!categoryId)}>
              전체
            </button>
            {CATEGORIES.map((c) => {
              const id = categories.find((category) => category.name === c.name)?.id;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => selectCategory(c.name)}
                  className={chipClass(id !== undefined && categoryId === String(id))}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 섹션 폭은 그리드 폭(w-fit)을 따르고, 시안처럼 정렬 줄이 카드보다 양옆 66px 넓게 나오도록
            그리드 쪽에 좌우 패딩을 준다. 5열(2xl)에서는 66px 를 더하면 화면을 넘쳐 패딩을 뺐다 */}
        <section className="flex flex-col items-center gap-12 w-fit max-w-full">
          {/* 결과 요약 + 정렬 */}
          <div className="w-full flex items-center justify-between font-semibold text-[#838383]">
            <p>
              {keyword && <span className="text-[#1c1c1c]">&ldquo;{keyword}&rdquo; </span>}
              {keyword ? "검색 결과 " : "전체 "}
              <span className="text-[#1c1c1c]">{total.toLocaleString()}</span>건
            </p>
            <div className="flex gap-2 font-medium">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateQuery({ sort: option.value })}
                  className={`cursor-pointer transition-colors ${
                    sort === option.value ? "text-main" : "hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 카드 폭(260px)은 고정하고 화면 폭에 따라 한 줄 1~5개로 바꾼다.
              auto-fill 은 최대 개수를 제한할 수 없어 브레이크포인트마다 열 수를 명시했다.
              각 구간은 (열 수 × 260 + 간격 36 + 좌우 여백 40)이 들어가는 가장 작은 폭이다 */}
          <div className="xl:px-[66px] 2xl:px-0 max-w-full">
          {loading || posts.length > 0 ? (
            <div className="grid grid-cols-[repeat(1,260px)] sm:grid-cols-[repeat(2,260px)] lg:grid-cols-[repeat(3,260px)] xl:grid-cols-[repeat(4,260px)] 2xl:grid-cols-[repeat(5,260px)] gap-x-9 gap-y-16">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                : posts.map((post) => <ServiceCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="w-[260px] sm:w-[556px] lg:w-[852px] xl:w-[1148px] 2xl:w-[1444px] max-w-full py-20 flex flex-col items-center gap-2">
              <p className="font-medium text-ink-sub">검색 결과가 없습니다.</p>
              <p className="text-sm text-ink-muted">다른 검색어나 카테고리로 찾아보세요.</p>
            </div>
          )}
          </div>

          {!loading && !isLast && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-[260px] h-9 rounded-lg border border-ink-muted font-medium text-ink hover:border-main hover:text-main transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? "불러오는 중..." : "더 보기"}
            </button>
          )}
        </section>
      </main>
      <TopButton />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
