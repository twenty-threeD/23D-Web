"use client";

import { useEffect, useState } from "react";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import PremiumCard from "@/src/components/PremiumCard";
import PremiumCardSkeleton from "@/src/components/PremiumCardSkeleton";
import NormalCard from "@/src/components/NormalCard";
import NormalCardSkeleton from "@/src/components/NormalCardSkeleton";
import Search from "@/src/components/Search";
import { getPosts, type Post } from "@/src/lib/post";

export default function Page() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPosts()
      .then((list) => setPosts(list))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
            <Search />
            <div className="flex w-full gap-3">
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-red-200">
                  <img src="category/brush.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">이사/청소</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-orange-200">
                  <img src="category/wrench.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">설치/수리</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-yellow-200">
                  <img src="category/table.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">인테리어</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-lime-200">
                  <img src="category/art.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">외주</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-green-200">
                  <img src="category/money.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">법률/금융</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-blue-200">
                  <img src="category/book.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">과외</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-purple-200">
                  <img src="category/car.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">자동차</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-pink-200">
                  <img src="category/box.png" alt="" />
                </div>
                <p className="whitespace-nowrap text-sm mt-2">기타</p>
              </div>
            </div>
          </div>
          <div className="w-full h-64 border overflow-hidden border-zinc-300 rounded-lg">
            <img src="banner.png" alt="" className="h-full object-cover" />
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
                    <PremiumCard key={post.id} id={post.id} title={post.title} content={post.content} fileUrl={post.fileUrls?.[0]} />
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
                    <NormalCard key={post.id} id={post.id} title={post.title} content={post.content} fileUrl={post.fileUrls?.[0]} />
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
                    <NormalCard key={post.id} id={post.id} title={post.title} content={post.content} fileUrl={post.fileUrls?.[0]} />
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
