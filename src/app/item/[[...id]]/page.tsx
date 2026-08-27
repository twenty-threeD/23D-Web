"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import Banner from "@/src/components/Banner";
import Portfolio from "@/src/components/Portfolio";
import PriceCard from "@/src/components/PriceCard";
import DoButton from "@/src/components/DoButton";
import Review from "@/src/components/Review";
import StarRating from "@/src/components/StarRating";
import NormalCard from "@/src/components/NormalCard";
import TopButton from "@/src/components/TopButton";
import { FaStar } from "react-icons/fa";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { getPost, getPosts, favoritePost, unfavoritePost, getFavoritePosts, getPostMainImage, type Post } from "@/src/lib/post"
import { parsePostContent } from "@/src/types/priceCard";
import { useAuthStore } from "@/src/store/authStore";
import { useHandleError } from "@/src/hooks/useHandleError";
import { toRelativeUrl } from "@/src/lib/file"
import ImageLightbox from "@/src/components/ImageLightbox"
import { createReview, getReviews, type Review as ReviewData } from "@/src/lib/review"

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const token = useAuthStore((s) => s.accessToken);
  const myUsername = useAuthStore((s) => s.username);
  const handleError = useHandleError();
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    if (!postId) return;
    getPost(postId, token)
      .then((res) => setPost(res.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, token]);

  useEffect(() => {
    getPosts(token).then((list) => setRelatedPosts(list)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !postId) return;
    getFavoritePosts(token)
      .then((list) => setIsFavorited(list.some((p) => p.id === postId)))
      .catch(() => {});
  }, [token, postId]);

  useEffect(() => {
    if (!postId) return;
    // 추정된 후기 조회 API(/api/review)를 호출합니다. 실제 백엔드 명세 확인이 필요합니다.
    getReviews(postId, token)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [postId, token]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > el.clientHeight + 1);
  }, [post]);

  async function handleToggleFavorite() {
    if (!token || !postId) { router.push("/login/signin"); return; }
    setFavoriteBusy(true);
    try {
      if (isFavorited) {
        await unfavoritePost(token, postId);
        setIsFavorited(false);
      } else {
        await favoritePost(token, postId);
        setIsFavorited(true);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function handleCreateReview() {
    if (!token || !postId) {
      router.push("/login/signin");
      return;
    }

    const content = reviewContent.trim();
    if (!content) return;

    setReviewBusy(true);
    try {
      // 추정된 후기 등록 API(/api/review)에 게시글 ID, 별점, 내용을 전달합니다.
      const created = await createReview(token, {
        postId,
        rating: reviewRating,
        content,
      });
      const newReview: ReviewData = created ?? {
        id: `local-${Date.now()}`,
        rating: reviewRating,
        content,
        createdAt: new Date().toISOString(),
        author: { username: myUsername },
      };
      setReviews((current) => [newReview, ...current]);
      setReviewContent("");
      setReviewRating(5);
    } catch (e) {
      handleError(e);
    } finally {
      setReviewBusy(false);
    }
  }

  const { description, plans } = post ? parsePostContent(post.content) : { description: "", plans: [] };
  const isOwner = !!(post?.member?.username && myUsername && post.member.username === myUsername);
  const reviewCount = reviews.length;
  const review = reviewCount > 0
    ? reviews.reduce((total, item) => total + item.rating, 0) / reviewCount
    : 0;
  const headerImage = post?.fileUrls?.[0];
  const contentImages = post?.fileUrls && post.fileUrls.length > 1
    ? post.fileUrls.slice(1)
    : post?.fileUrls ?? [];

  if (loading) {
    return (
      <div>
        <Header />
        <p className="text-center py-20 text-zinc-400">불러오는 중...</p>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Banner imageUrl={headerImage ? toRelativeUrl(headerImage) : undefined} />
      <div className="flex flex-col px-20 py-8 gap-16">
        <div className="flex gap-16 justify-between items-start">
          {/* left content */}
          <div className="flex flex-1 flex-col gap-6 min-w-0">
            {/* 프로필 */}
            <div className="flex flex-col p-5 border border-zinc-300 rounded-lg gap-8 items-center justify-center">

              <div className="w-full flex items-start justify-between min-w-0">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-300 overflow-hidden">
                    {post?.member?.imageUrl && (
                      <img
                        src={toRelativeUrl(post.member.imageUrl) || "/profile.png"}
                        alt={post.member.name ?? post.member.username}
                        className="w-full h-full object-cover border border-zinc-300 rounded-full"
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <span className="font-bold text-xl">{post?.title ?? "전문가의 꼼꼼한 시공"}</span>
                    <span className="text-sm text-zinc-400">{post?.member?.name ?? post?.member?.username ?? "오늘의 에어컨"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-zinc-600">{post?.category?.fullName ?? "카테고리 미설정"}</span>
                  {isOwner ? (
                    <button
                      onClick={() => router.push(`/upload/${postId}`)}
                      className="px-3 py-1 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 cursor-pointer"
                    >
                      수정
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleFavorite}
                      disabled={favoriteBusy}
                      className="p-1 disabled:opacity-50 cursor-pointer"
                      aria-label="찜하기"
                    >
                      {isFavorited ? (
                        <IoMdHeart className="text-2xl text-main" />
                      ) : (
                        <IoMdHeartEmpty className="text-2xl text-main" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex w-full py-4 items-center justify-between">
                <div className="w-1/3 flex flex-col gap-2 text-center">
                  <span className="text-sm text-zinc-400">총 거래 건수</span>
                  <h3 className="text-2xl font-semibold">24건</h3>
                </div>
                <div className="w-1/3 flex flex-col gap-2 text-center border-x border-zinc-300">
                  <span className="text-sm text-zinc-400">리뷰</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <FaStar className="text-main size-5"/>
                    <h3 className="text-2xl font-semibold">{review ? review.toFixed(1) : "-"}</h3>
                    <span className="text-sm text-zinc-500">({reviewCount})</span>
                  </div>
                </div>
                <div className="w-1/3 flex flex-col gap-2 text-center">
                  <span className="text-sm text-zinc-400">경력</span>
                  <h3 className="text-2xl font-semibold">13년</h3>
                </div>
              </div>
            </div>

            {/* 포트폴리오 — 실제 데이터 연동 전까지는 숨김 */}
            {false && (
              <>
                <div className="flex justify-between">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-bold">포트폴리오</h2>
                    <span className="text-md text-zinc-400">(24)</span>
                  </div>
                  <button className="text-md text-zinc-400">전체 보기</button>
                </div>
                <div className="w-full flex gap-4">
                  <Portfolio />
                  <Portfolio />
                  <Portfolio />
                  <Portfolio />
                </div>
              </>
            )}

            {/* 상세 설명 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">서비스 설명</h2>
              <p
                ref={descriptionRef}
                className={`whitespace-pre-line ${isExpanded ? "" : "line-clamp-10"} ${
                  !isExpanded && canExpand
                    ? "bg-linear-to-b from-zinc-500 via-zinc-300 to-white bg-clip-text text-transparent"
                    : "text-zinc-500"
                }`}
              >
                {description || "서비스 설명이 없습니다."}
              </p>
              {canExpand && (
                <DoButton onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? "접기" : "더보기"}
                </DoButton>
              )}
            </div>

            {/* 이미지 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">이미지</h2>
              {contentImages.length > 0 ? (
                <div className="w-full flex gap-4">
                  {contentImages.map((url, i) => (
                    <div
                      key={i}
                      className="w-48 h-48 rounded-lg overflow-hidden bg-zinc-200 transition-opacity hover:opacity-90 cursor-pointer"
                      onClick={() => setLightboxSrc(toRelativeUrl(url))}
                    >
                      <img src={toRelativeUrl(url)} alt={`이미지 ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p>이미지가 없습니다</p>
              )}
            </div>

            {lightboxSrc && (
              <ImageLightbox src={lightboxSrc} alt="이미지" onClose={() => setLightboxSrc(null)} />
            )}

            {/* 리뷰 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">리뷰 {reviewCount}개</h2>
              <div className="flex gap-2 w-full px-4 py-10 border border-zinc-300 rounded-lg items-center">
                <StarRating rating={review} />
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-semibold">{review ? review.toFixed(1) : "-"}</p>
                  <span className="text-sm text-zinc-500">({reviewCount})</span>
                </div>
              </div>

              {!isOwner && (
                <div className="flex flex-col gap-3 p-5 border border-zinc-200 rounded-lg bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">후기 남기기</h3>
                    <div className="flex items-center gap-2">
                      <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                      <span className="text-sm font-semibold text-zinc-600">{reviewRating}.0</span>
                    </div>
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value.slice(0, 500))}
                    placeholder="서비스는 어떠셨나요? 후기를 남겨주세요."
                    maxLength={500}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-main"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{reviewContent.length} / 500</span>
                    <button
                      type="button"
                      onClick={handleCreateReview}
                      disabled={reviewBusy || !reviewContent.trim()}
                      className="rounded-xl bg-main px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
                    >
                      {reviewBusy ? "등록 중..." : "후기 등록"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                {reviews.length > 0 ? reviews.map((item) => (
                  <Review key={item.id} review={item} />
                )) : (
                  <p className="py-8 text-center text-sm text-zinc-400">아직 등록된 후기가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* right content */}
          <div className="flex flex-col gap-4">
            <div className="w-100 shrink-0">
              <PriceCard username={post?.member?.username} plans={plans} postId={postId ?? undefined} />
            </div>
            <div className="bg-zinc-100 p-4 rounded-lg">
              <ul className="flex flex-col gap-1 list-disc list-inside">
                <li className="text-zinc-400 text-xs font-semibold">서비스 이후 금액이 전달 되니 안전하게 거래하세요.</li>
                <li className="text-zinc-400 text-xs font-semibold">견적서와 계약서는 블록체인을 통해 평생 안전히 보관됩니다.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold shrink-0">이웃들이<br/>많이 찾아요</h2>
          <div className="flex gap-4">
            {relatedPosts.slice(0, 4).map((p) => (
              <NormalCard key={p.id} id={p.id} title={p.title} content={p.content} fileUrl={getPostMainImage(p.fileUrls)} category={p.category} />
            ))}
          </div>
        </div>

        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold shrink-0">재방문율이<br/>높아요</h2>
          <div className="flex gap-4">
            {relatedPosts.slice(4, 8).map((p) => (
              <NormalCard key={p.id} id={p.id} title={p.title} content={p.content} fileUrl={getPostMainImage(p.fileUrls)} category={p.category} />
            ))}
          </div>
        </div>
      </div>
      <TopButton />
      <Footer />
    </div>
  );
}
