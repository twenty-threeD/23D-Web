"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getPosts,
  getPostsByCategory,
  searchPosts,
  isCommunityCategory,
  categoryLabel,
  filterByRegion,
  sortByLatest,
  needsRegionFilter,
  fetchAllPages,
  communityListHref,
  COMMUNITY_PAGE_SIZE,
} from "@/src/lib/community";
import CommunityPagination from "@/src/components/CommunityPagination";
import { useMyLocation } from "@/src/hooks/useMyLocation";
import { useAuthStore } from "@/src/store/authStore";
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
  category?: string
  fileUrl?: string
  updatedAt: string
}

function PostList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const category = isCommunityCategory(categoryParam) ? categoryParam : null;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const token = useAuthStore((s) => s.accessToken);
  const myUsername = useAuthStore((s) => s.username);
  const { location, loaded: locationLoaded } = useMyLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  // 서버 페이징일 때만 쓴다. 프론트에서 자르는 목록은 posts 길이로 계산한다
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // 카테고리를 바꾸면 검색어는 초기화
  useEffect(() => { setKeyword(""); }, [category]);

  const clientPaging = needsRegionFilter(category, keyword);
  // 프론트에서 자르는 목록은 한 번 다 받아두면 페이지를 옮겨도 다시 부를 필요가 없다
  const serverPage = clientPaging ? 0 : page - 1;

  const fetchPosts = useCallback(async () => {
    if (!locationLoaded) return;
    setLoading(true);
    try {
      if (clientPaging) {
        const all = await fetchAllPages<Post>((p, size) =>
          keyword
            ? searchPosts(keyword, token, p, size)
            : category
              ? getPostsByCategory(category, token, p, size)
              : getPosts(token, p, size)
        );
        setPosts(sortByLatest(filterByRegion(all, location?.ctprvnCd ?? null, myUsername)));
      } else if (category) {
        const res = await getPostsByCategory(category, token, serverPage);
        setPosts(res.data?.content ?? []);
        setServerTotalPages(Math.max(1, res.data?.totalPages ?? 1));
      }
    } catch {
      setPosts([]);
      setServerTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [clientPaging, serverPage, keyword, category, token, locationLoaded, location, myUsername]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 새로 검색하면 1페이지부터 본다. 검색어는 URL 에 없어 같은 화면 안에서만 유지된다
  function handleSearch(value: string) {
    setKeyword(value);
    if (page > 1) router.replace(communityListHref(category, 1));
  }

  const totalPages = clientPaging
    ? Math.max(1, Math.ceil(posts.length / COMMUNITY_PAGE_SIZE))
    : serverTotalPages;
  const currentPage = Math.min(page, totalPages);
  const pagePosts = clientPaging
    ? posts.slice((currentPage - 1) * COMMUNITY_PAGE_SIZE, currentPage * COMMUNITY_PAGE_SIZE)
    : posts;

  return (
    <main className="flex flex-col gap-4 w-full">
      {/* items-stretch 로 버튼 높이를 검색창에 맞춘다. 검색창은 header/chat 에서도 쓰여
          높이를 건드리면 다른 화면이 같이 바뀌므로 버튼 쪽을 맞추는 방향으로 둔다. */}
      <div className="flex items-stretch gap-2">
        <Search where="post" onSearch={handleSearch} />
        <button
          onClick={() => router.push("/community/write")}
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
            {category === "NEIGHBORHOOD" && !location
              ? "프로필에서 지역을 설정하면 같은 지역 주민의 글을 볼 수 있습니다."
              : category === "NEIGHBORHOOD"
                ? `'${location!.locationName.split(" ")[0]}' 주민 게시글이 없습니다.`
                : category ? `'${categoryLabel(category)}' 게시글이 없습니다.` : "게시글이 없습니다."}
          </p>
        ) : (
          pagePosts.map((post) => (
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

      {!loading && (
        <CommunityPagination
          page={currentPage}
          totalPages={totalPages}
          hrefFor={(p) => communityListHref(category, p)}
        />
      )}
    </main>
  );
}

export default function Page() {
  return (
    <div>
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
    </div>
  );
}
