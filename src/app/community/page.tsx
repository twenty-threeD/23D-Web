"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPosts, searchPosts } from "@/src/lib/community";
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

export default function Page() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = keyword
        ? await searchPosts(keyword, token)
        : await getPosts(token);
      setPosts(res.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div>
      <Header />
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        <CommunityMenu />

        <main className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2">
            <Search where="post" onSearch={setKeyword} />
            <button
              onClick={() => router.push("/community/write")}
              className="text-lg px-4 py-2 border text-center bg-main border-zinc-300 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer hover:bg-orange-600"
            >
              글작성
            </button>
          </div>

          <div className="flex flex-col divide-y divide-zinc-300">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <PostItemSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <p className="py-8 text-center text-zinc-400">게시글이 없습니다.</p>
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
      </div>
      <TopButton />
      <Footer />
    </div>
  );
}
