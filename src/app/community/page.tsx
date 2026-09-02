"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getPosts,
  getPostsByCategory,
  searchPosts,
  isCommunityCategory,
  categoryLabel,
} from "@/src/lib/community";
import { useAuthStore } from "@/src/store/authStore";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import CommunityMenu from "@/src/components/CommunitySideBar";
import PostItem from "@/src/components/PostItem";
import Search from "@/src/components/Search";
import TopButton from "@/src/components/TopButton";
import PostItemSkeleton from "@/src/components/PostItemSkeleton";

interface Post {
  id: number
  username: string
  title: string
  content: string
  fileUrl?: string
  updatedAt: string
}

function PostList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const category = isCommunityCategory(categoryParam) ? categoryParam : null;
  const token = useAuthStore((s) => s.accessToken);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // 카테고리를 바꾸면 검색어는 초기화
  useEffect(() => { setKeyword(""); }, [category]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = keyword
        ? await searchPosts(keyword, token)
        : category
          ? await getPostsByCategory(category, token)
          : await getPosts(token);
      setPosts(res.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <main className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <Search where="post" onSearch={setKeyword} />
        <button
          onClick={() => router.push("/community/write")}
          className="px-4 py-2 text-center bg-main text-white text-sm font-semibold rounded-xl whitespace-nowrap transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
        >
          글작성
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-300">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <PostItemSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">
            {category ? `'${categoryLabel(category)}' 게시글이 없습니다.` : "게시글이 없습니다."}
          </p>
        ) : (
          posts.map((post) => (
            <PostItem
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              imageUrl={post.fileUrl}
              createdAt={new Date(post.updatedAt).toLocaleDateString("ko-KR")}
            />
          ))
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <div>
      <Header />
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        <CommunityMenu />
        <Suspense
          fallback={
            <main className="flex flex-col divide-y divide-zinc-300 w-full">
              {Array.from({ length: 5 }).map((_, i) => <PostItemSkeleton key={i} />)}
            </main>
          }
        >
          <PostList />
        </Suspense>
      </div>
      <TopButton />
      <Footer />
    </div>
  );
}
