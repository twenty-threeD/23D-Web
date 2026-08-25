"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import PremiumCard from "@/src/components/PremiumCard";
import PremiumCardSkeleton from "@/src/components/PremiumCardSkeleton";
import NormalCard from "@/src/components/NormalCard";
import NormalCardSkeleton from "@/src/components/NormalCardSkeleton";
import Search from "@/src/components/Search";
import { getPosts, searchPosts, getPostCategories, type Post, type PostCategory } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";

const CATEGORY_ICONS: { label: string; icon: string; color: string }[] = [
  { label: "이사/청소", icon: "/category/brush.png", color: "bg-red-200" },
  { label: "설치/수리", icon: "/category/wrench.png", color: "bg-orange-200" },
  { label: "인테리어", icon: "/category/table.png", color: "bg-yellow-200" },
  { label: "외주", icon: "/category/art.png", color: "bg-lime-200" },
  { label: "법률/금융", icon: "/category/money.png", color: "bg-green-200" },
  { label: "과외", icon: "/category/book.png", color: "bg-blue-200" },
  { label: "자동차", icon: "/category/car.png", color: "bg-purple-200" },
  { label: "기타", icon: "/category/box.png", color: "bg-pink-200" },
];

function MainContent() {
  const token = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const categoryParam = searchParams.get("category");
  const categoryIds = categoryParam ? categoryParam.split(",").map(Number) : null;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PostCategory[]>([]);

  useEffect(() => {
    getPostCategories().then(setCategories).catch(() => {});
  }, []);

  function categoryHref(label: string): string {
    const match = categories.find((c) => c.name === label);
    return match ? `/search?categoryId=${match.id}` : "/search";
  }

  useEffect(() => {
    setLoading(true);
    const request = keyword ? searchPosts(keyword) : getPosts(token);
    request
      .then((list) => setPosts(categoryIds ? list.filter((p) => p.category && categoryIds.includes(p.category.id)) : list))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [token, keyword, categoryParam]);

  function handleSearch(value: string) {
    if (value.trim()) router.push(`/search?keyword=${encodeURIComponent(value)}`);
    else router.push("/search");
  }

  const premiumPosts = posts.slice(0, 3);
  const popularPosts = posts.slice(0, 4);
  const revisitPosts = posts.slice(4, 8);

  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center px-20 py-8 gap-16">
        {/* 검색 + 카테고리 */}
        <div className="flex items-center justify-center gap-16 w-full">
          <div className="flex flex-col w-300 gap-4 justify-center">
            <div className="flex flex-col">
              <h1 className="text-3xl font-semibold">능력자가 필요한 순간,</h1>
              <h1 className="text-3xl font-semibold whitespace-nowrap">좋은 능력자를 바로바로 잇다에서!</h1>
            </div>
            <Search onSearch={handleSearch} />
            <div className="flex w-full gap-3">
              {CATEGORY_ICONS.map((c) => (
                <Link
                  key={c.label}
                  href={categoryHref(c.label)}
                  className="flex flex-col items-center justify-center w-0 flex-1"
                >
                  <div className={`w-full rounded-lg aspect-square ${c.color}`}>
                    <img src={c.icon} alt="" />
                  </div>
                  <p className="whitespace-nowrap text-sm mt-2">{c.label}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="w-full overflow-hidden border border-zinc-300 rounded-lg">
            <img src="/banner.png" alt="" className="w-full h-auto" />
          </div>
        </div>

        {/* 광고 */}
        <div className="w-full h-full flex flex-col gap-2">
          <div className="flex gap-2 items-baseline">
            <h2 className="text-2xl font-bold">유명한 능력자</h2>
            <small className="text-zinc-400">광고</small>
          </div>
          <div className="flex items-center justify-between gap-8 w-full">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <PremiumCardSkeleton key={i} />)
              : premiumPosts.length > 0
                ? premiumPosts.map((post) => (
                    <PremiumCard key={post.id} id={post.id} title={post.title} content={post.content} fileUrls={post.fileUrls} />
                  ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-lg h-72 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
                      등록된 항목이 없습니다
                    </div>
                  ))
            }
          </div>
        </div>

        {/* 이웃들이 많이 찾아요 */}
        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold shrink-0">이웃들이<br/>많이 찾아요</h2>
          <div className="flex gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <NormalCardSkeleton key={i} />)
              : popularPosts.length > 0
                ? popularPosts.map((post) => (
                    <NormalCard key={post.id} id={post.id} title={post.title} content={post.content} fileUrl={post.fileUrls?.[0]} category={post.category} />
                  ))
                : <p className="text-zinc-400 text-sm self-center">등록된 항목이 없습니다</p>
            }
          </div>
        </div>

        {/* 재방문율이 높아요 */}
        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold shrink-0">재방문율이<br/>높아요</h2>
          <div className="flex gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <NormalCardSkeleton key={i} />)
              : revisitPosts.length > 0
                ? revisitPosts.map((post) => (
                    <NormalCard key={post.id} id={post.id} title={post.title} content={post.content} fileUrl={post.fileUrls?.[0]} category={post.category} />
                  ))
                : <p className="text-zinc-400 text-sm self-center">등록된 항목이 없습니다</p>
            }
          </div>
        </div>
      </div>
      <Footer />
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
