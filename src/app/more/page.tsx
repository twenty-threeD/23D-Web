"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiArrowUpRight, FiTrendingUp } from "react-icons/fi";
import NormalCard from "@/src/components/NormalCard";
import NormalCardSkeleton from "@/src/components/NormalCardSkeleton";
import TopButton from "@/src/components/TopButton";
import {
  getPostCategories,
  getPostMainImage,
  searchPostsPaged,
  type Post,
  type PostCategory,
} from "@/src/lib/post";
import { PAGE_PADDING } from "@/src/lib/layout";

const SORT_OPTIONS = [
  { label: "인기순", value: "viewCount,desc" },
  { label: "최신순", value: "updatedAt,desc" },
] as const;

const PAGE_SIZE = 20;

function MoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    getPostCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    searchPostsPaged({
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
  }, [categoryId, sort]);

  function updateQuery(next: { categoryId?: string | null; sort?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.categoryId === null) params.delete("categoryId");
    else if (next.categoryId !== undefined) params.set("categoryId", next.categoryId);

    if (next.sort === undefined || next.sort === SORT_OPTIONS[0].value) params.delete("sort");
    else params.set("sort", next.sort);

    setLoading(true);
    router.push(`/more${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const res = await searchPostsPaged({
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

  return (
    <div>
      {/* 좌우·위아래 여백은 다른 페이지와 같은 기준을 쓴다 */}
      <main className={`flex flex-col items-center ${PAGE_PADDING} gap-8 lg:gap-10`}>
        <div className="w-full flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-line pb-8">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">이웃들이<br className="sm:hidden" /> 많이 찾아요</h1>
              <p className="text-zinc-500">지금 이웃들이 관심 있게 보고 있는 능력자들을 모아봤어요.</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-wrap gap-2">
          <button
            onClick={() => updateQuery({ categoryId: null })}
            className={`px-4 py-1.5 rounded-full border text-sm transition-colors cursor-pointer ${
              !categoryId
                ? "bg-main text-white border-main"
                : "border-line text-zinc-500 hover:border-main hover:text-main"
            }`}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateQuery({ categoryId: String(category.id) })}
              className={`px-4 py-1.5 rounded-full border text-sm transition-colors cursor-pointer ${
                categoryId === String(category.id)
                  ? "bg-main text-white border-main"
                  : "border-line text-zinc-500 hover:border-main hover:text-main"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="w-full flex items-baseline justify-between gap-4">
          <p className="text-sm text-zinc-500">
            {categoryId ? "선택한 카테고리 " : "전체 서비스 "}
            <span className="font-semibold text-zinc-800">{total.toLocaleString()}</span>건
          </p>
          <div className="flex gap-3 shrink-0">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateQuery({ sort: option.value })}
                className={`text-sm cursor-pointer transition-colors ${
                  sort === option.value ? "text-main font-semibold" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 휴대폰은 260px 카드가 한 줄에 하나만 들어가 화면이 길어져서, 640px 미만에서는 두 칸 그리드로 채운다.
            그보다 넓으면 260px 칸을 들어가는 만큼 두고 남는 폭을 칸 사이로 나눈다.
            왼쪽부터 채우면 줄 끝에 빈 폭이 남아, 끝까지 가는 제목·구분선과 달리 오른쪽 여백만 넓어 보인다 */}
        <div className="w-full grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-[repeat(auto-fill,260px)] sm:justify-between sm:gap-x-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <NormalCardSkeleton key={i} inGrid />)
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <NormalCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                fileUrl={getPostMainImage(post.fileUrls)}
                category={post.category}
                inGrid
              />
            ))
          ) : (
            <div className="col-span-full w-full py-20 flex flex-col items-center gap-2">
              <p className="text-zinc-500">아직 등록된 서비스가 없습니다.</p>
              <p className="text-sm text-zinc-400">다른 카테고리를 선택해 다시 찾아보세요.</p>
            </div>
          )}
        </div>

        {!loading && !isLast && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-lg border border-line text-sm font-semibold text-zinc-600 hover:border-main hover:text-main transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? "불러오는 중..." : "더 보기"}
          </button>
        )}
      </main>
      <TopButton />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MoreContent />
    </Suspense>
  );
}
