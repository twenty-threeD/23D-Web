"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getJobPosts, searchJobPosts } from "@/src/lib/jobs";
import { parseJobContent } from "@/src/types/jobPost";
import { useAuthStore } from "@/src/store/authStore";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import JobMenu from "@/src/components/JobSideBar";
import JobPostItem from "@/src/components/JobPostItem";
import Search from "@/src/components/Search";
import TopButton from "@/src/components/TopButton";
import PostItemSkeleton from "@/src/components/PostItemSkeleton";

interface JobPost {
  id: number
  username: string
  title: string
  content: string
  fileUrl?: string
  updatedAt: string
}

function JobList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "all";
  const token = useAuthStore((s) => s.accessToken);
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = keyword
        ? await searchJobPosts(keyword, token)
        : await getJobPosts(token);
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

  const visiblePosts = category === "all"
    ? posts
    : posts.filter((p) => String(parseJobContent(p.content).categoryId) === category);

  return (
    <main className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <Search where="post" onSearch={setKeyword} />
        <button
          onClick={() => router.push("/jobs/write")}
          className="text-lg px-4 py-2 border text-center bg-main border-zinc-300 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer hover:bg-orange-600"
        >
          의뢰 등록
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-300">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <PostItemSkeleton key={i} />)
        ) : visiblePosts.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">등록된 의뢰가 없습니다.</p>
        ) : (
          visiblePosts.map((post) => (
            <JobPostItem
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
        <JobMenu />
        <Suspense fallback={<main className="flex flex-col gap-4 w-full" />}>
          <JobList />
        </Suspense>
      </div>
      <TopButton />
      <Footer />
    </div>
  );
}
