"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchJobPosts, type JobPostListItem } from "@/src/lib/jobs";
import { isJobPostType, jobTypeLabel } from "@/src/types/jobPost";
import { useAuthStore } from "@/src/store/authStore";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import JobMenu from "@/src/components/JobSideBar";
import JobPostItem from "@/src/components/JobPostItem";
import Search from "@/src/components/Search";
import TopButton from "@/src/components/TopButton";
import PostItemSkeleton from "@/src/components/PostItemSkeleton";

const PAGE_SIZE = 20;

function JobList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  // 사이드바에서 '전체'를 고르면 type 파라미터가 빠지고, 그때는 서버에도 안 보낸다.
  const postType = isJobPostType(typeParam) ? typeParam : undefined;
  const token = useAuthStore((s) => s.accessToken);
  const [posts, setPosts] = useState<JobPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [last, setLast] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");

  // 유형을 바꾸면 검색어는 초기화
  useEffect(() => { setKeyword(""); }, [postType]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchJobPosts({ keyword, postType, page: 0, size: PAGE_SIZE }, token);
      setPosts(res.content);
      setPage(res.page);
      setLast(res.last);
    } catch {
      setPosts([]);
      setLast(true);
    } finally {
      setLoading(false);
    }
  }, [keyword, postType, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function loadMore() {
    if (loadingMore || last) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await searchJobPosts({ keyword, postType, page: next, size: PAGE_SIZE }, token);
      setPosts((prev) => [...prev, ...res.content]);
      setPage(res.page);
      setLast(res.last);
    } catch {
      setLast(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="flex flex-col gap-4 w-full">
      {/* items-stretch 로 버튼 높이를 검색창에 맞춘다. 검색창은 header/chat 에서도 쓰여
          높이를 건드리면 다른 화면이 같이 바뀌므로 버튼 쪽을 맞추는 방향으로 둔다. */}
      <div className="flex items-stretch gap-2">
        <Search where="post" onSearch={setKeyword} />
        <button
          onClick={() => router.push(postType ? `/jobs/write?type=${postType}` : "/jobs/write")}
          className="px-4 text-center bg-main text-white font-semibold rounded-lg whitespace-nowrap transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
        >
          글작성
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-300">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <PostItemSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">
            {postType ? `'${jobTypeLabel(postType)}' 게시글이 없습니다.` : "게시글이 없습니다."}
          </p>
        ) : (
          posts.map((post) => (
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

      {!loading && !last && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="self-center px-6 py-2 rounded-lg border border-zinc-300 text-zinc-600 font-semibold hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
        >
          {loadingMore ? "불러오는 중..." : "더 보기"}
        </button>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <div>
      <Header />
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        <JobMenu />
        <Suspense
          fallback={
            <main className="flex flex-col divide-y divide-zinc-300 w-full">
              {Array.from({ length: 5 }).map((_, i) => <PostItemSkeleton key={i} />)}
            </main>
          }
        >
          <JobList />
        </Suspense>
      </div>
      <TopButton />
      <Footer />
    </div>
  );
}
