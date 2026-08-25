"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import Search from "@/src/components/Search";
import NormalCard from "@/src/components/NormalCard";
import NormalCardSkeleton from "@/src/components/NormalCardSkeleton";
import TopButton from "@/src/components/TopButton";
import { searchPostsPaged, getPostCategories, type Post, type PostCategory } from "@/src/lib/post";

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

  return (
    <div>
      <Header />
      <main className="flex flex-col items-center px-20 py-8 gap-8">
        <div className="w-full max-w-3xl">
          <Search
            where="post"
            initialValue={keyword}
            onSearch={(value) => updateQuery({ keyword: value })}
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="w-full flex flex-wrap gap-2">
          <button
            onClick={() => updateQuery({ categoryId: null })}
            className={`px-4 py-1.5 rounded-full border text-sm transition-colors cursor-pointer ${
              !categoryId
                ? "bg-main text-white border-main"
                : "border-zinc-300 text-zinc-500 hover:border-main hover:text-main"
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
                  : "border-zinc-300 text-zinc-500 hover:border-main hover:text-main"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 결과 요약 + 정렬 */}
        <div className="w-full flex items-baseline justify-between">
          <p className="text-sm text-zinc-500">
            {keyword && <span className="font-semibold text-zinc-800">&ldquo;{keyword}&rdquo;</span>}
            {keyword ? " 검색 결과 " : "전체 "}
            <span className="font-semibold text-zinc-800">{total.toLocaleString()}</span>건
          </p>
          <div className="flex gap-3">
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

        {/* 결과 목록 */}
        <div className="w-full flex flex-wrap gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <NormalCardSkeleton key={i} />)
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <NormalCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                fileUrl={post.fileUrls?.[0]}
                category={post.category}
              />
            ))
          ) : (
            <div className="w-full py-20 flex flex-col items-center gap-2">
              <p className="text-zinc-500">검색 결과가 없습니다.</p>
              <p className="text-sm text-zinc-400">다른 검색어나 카테고리로 찾아보세요.</p>
            </div>
          )}
        </div>

        {!loading && !isLast && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-600 hover:border-main hover:text-main transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? "불러오는 중..." : "더 보기"}
          </button>
        )}
      </main>
      <TopButton />
      <Footer />
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
