"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PriceCard from "@/src/components/PriceCard";
import Review from "@/src/components/Review";
import StarRating from "@/src/components/StarRating";
import TopButton from "@/src/components/TopButton";
import ServiceSection, { SECTION_INSET } from "@/src/components/main/ServiceSection";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { getPost, getPosts, favoritePost, unfavoritePost, getFavoritePosts, type Post } from "@/src/lib/post"
import { parsePostContent } from "@/src/types/priceCard";
import { useAuthStore } from "@/src/store/authStore";
import { useHandleError } from "@/src/hooks/useHandleError";
import { toRelativeUrl } from "@/src/lib/file"
import ImageLightbox from "@/src/components/ImageLightbox"
import { createReview, getReviews, type Review as ReviewData } from "@/src/lib/review"
import { signinPath } from "@/src/lib/navigation"

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
  // 결제 여부는 원래 견적서 상태(PAID)로 판단했지만 견적서 기능을 쓰지 않아 걷어냈다.
  // 내 결제 이력을 조회할 API 가 없어, 생기기 전까지는 기존과 같이 후기 작성을 막아둔다.
  const hasPaid = false;
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
    if (!token || !postId) { router.push(signinPath()); return; }
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
      router.push(signinPath());
      return;
    }

    const content = reviewContent.trim();
    if (!content) return;

    setReviewBusy(true);
    try {
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
  // 같은 사람이 후기를 여러 번 남기지 못하게 막는다
  const alreadyReviewed = !!myUsername && reviews.some((r) => r.author?.username === myUsername);
  const canReview = !isOwner && hasPaid && !alreadyReviewed;
  const reviewCount = reviews.length;
  const review = reviewCount > 0
    ? reviews.reduce((total, item) => total + item.rating, 0) / reviewCount
    : 0;
  const headerImage = post?.fileUrls?.[0];
  const contentImages = post?.fileUrls && post.fileUrls.length > 1
    ? post.fileUrls.slice(1)
    : post?.fileUrls ?? [];

  // 메인과 같은 규칙으로 줄을 채운다. 추천 API 가 없어 전체 글에서 잘라 쓴다
  const revisitPosts = [...relatedPosts.slice(4), ...relatedPosts.slice(0, 4)].slice(0, 10);
  const popularPosts = relatedPosts.slice(0, 10);

  if (loading) {
    return (
      <div>
        <p className="text-center py-20 text-ink-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-20 lg:gap-40 pt-8 lg:pt-[52px] pb-24 overflow-x-hidden">
      {/* 좌우 여백은 /main 과 같은 규칙(SECTION_INSET)을 써서 두 화면의 본문 시작선을 맞춘다 */}
      <div className={`flex flex-col gap-[52px] w-full ${SECTION_INSET}`}>
      <div className="w-full h-[180px] md:h-[260px] rounded-2xl overflow-hidden bg-zinc-200">
        {/* 기존 대체 이미지(/profile_banner.png)는 public 에 없어 깨져 보였다. 이미지가 없으면 회색 배경만 둔다 */}
        {headerImage && (
          <img src={toRelativeUrl(headerImage)} alt="서비스 헤더 이미지" className="size-full object-cover" />
        )}
      </div>

        {/* 시안(1440) 비율 834:380 을 유지하되, lg 미만에서는 사이드바를 제목 아래로 내린다 */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-stretch lg:items-start">
          {/* left content */}
          <div className="order-2 lg:order-1 flex flex-1 flex-col gap-20 lg:gap-40 min-w-0">
            <div className="flex flex-col gap-12 lg:gap-[82px]">
              {/* 제목 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2.5 min-w-0">
                  <div className="flex items-end gap-4 flex-wrap">
                    <h1 className="text-2xl md:text-[32px] font-semibold text-black leading-none">{post?.title ?? "제목 없음"}</h1>
                    {post?.category && (
                      <span className="font-medium text-[#838383]">{post.category.fullName ?? post.category.name}</span>
                    )}
                  </div>
                  <span className="font-semibold text-[#838383]">{post?.member?.name ?? post?.member?.username}</span>
                </div>
                {isOwner ? (
                  <button
                    onClick={() => router.push(`/upload/${postId}`)}
                    className="shrink-0 px-3 py-1 text-sm text-ink-sub border border-[#d8d8d8] rounded-lg hover:bg-zinc-50 cursor-pointer"
                  >
                    수정
                  </button>
                ) : (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favoriteBusy}
                    className="shrink-0 p-1 disabled:opacity-50 cursor-pointer"
                    aria-label="찜하기"
                  >
                    {isFavorited ? <IoMdHeart className="text-2xl text-main" /> : <IoMdHeartEmpty className="text-2xl text-main" />}
                  </button>
                )}
              </div>

              {/* 서비스 설명 */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold text-black">서비스 설명</h2>
                <div className="relative">
                  <p
                    ref={descriptionRef}
                    className={`whitespace-pre-line font-medium text-ink-sub leading-[1.4] ${isExpanded ? "" : "line-clamp-[16]"}`}
                  >
                    {description || "서비스 설명이 없습니다."}
                  </p>
                  {/* 접힌 상태에서 본문이 끊긴 느낌 대신 서서히 사라지게 한다 */}
                  {!isExpanded && canExpand && (
                    <div className="absolute inset-x-0 bottom-0 h-[100px] bg-linear-to-b from-white/0 to-white pointer-events-none" />
                  )}
                </div>
                {canExpand && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full h-12 rounded-[10px] border border-[#838383] font-medium text-[#838383] hover:border-main hover:text-main transition-colors cursor-pointer"
                  >
                    {isExpanded ? "접기" : "더보기"}
                  </button>
                )}
              </div>

              {/* 본문 이미지 — 시안에는 없지만 올린 이미지를 볼 곳이 여기뿐이라 있을 때만 보여준다 */}
              {contentImages.length > 0 && (
                <div className="flex gap-4 flex-wrap">
                  {contentImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      className="size-48 rounded-xl overflow-hidden bg-zinc-200 transition-opacity hover:opacity-90 cursor-pointer"
                      onClick={() => setLightboxSrc(toRelativeUrl(url))}
                    >
                      <img src={toRelativeUrl(url)} alt={`이미지 ${i + 1}`} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lightboxSrc && (
              <ImageLightbox src={lightboxSrc} alt="이미지" onClose={() => setLightboxSrc(null)} />
            )}

            {/* 리뷰 */}
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-black">리뷰</h2>
                <div className="flex items-center gap-2.5">
                  <StarRating rating={review} size="lg" />
                  <p className="text-xl font-medium text-black">
                    {review ? review.toFixed(1) : "-"} <span className="text-base font-normal text-ink-sub">({reviewCount})</span>
                  </p>
                </div>
              </div>

              {/* 후기는 결제를 마친 구매자만, 한 번만 남길 수 있다. 글쓴이 본인에게는 폼 자체를 보여주지 않는다 */}
              {canReview && (
                <div className="flex flex-col gap-3 p-5 rounded-xl bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">후기 남기기</h3>
                    <div className="flex items-center gap-2">
                      <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                      <span className="text-sm font-semibold text-ink-sub">{reviewRating}.0</span>
                    </div>
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value.slice(0, 500))}
                    placeholder="서비스는 어떠셨나요? 후기를 남겨주세요."
                    maxLength={500}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[#d8d8d8] bg-white px-3 py-2 text-sm focus:outline-none focus:border-main"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-muted">{reviewContent.length} / 500</span>
                    <button
                      type="button"
                      onClick={handleCreateReview}
                      disabled={reviewBusy || !reviewContent.trim()}
                      className="h-[38px] rounded-lg bg-main px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
                    >
                      {reviewBusy ? "등록 중..." : "후기 등록"}
                    </button>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {reviews.map((item) => <Review key={item.id} review={item} />)}
                </div>
              ) : (
                <p className="text-xl font-medium text-[#838383]">아직 작성된 리뷰가 없어요.</p>
              )}
            </div>
          </div>

          {/* right content */}
          <div className="order-1 lg:order-2 flex flex-col gap-2 w-full lg:w-[340px] xl:w-[380px] shrink-0 lg:sticky lg:top-24">
            <PriceCard username={post?.member?.username} plans={plans} postId={postId ?? undefined} />
            <ul className="flex flex-col list-disc pl-6 pr-4 py-4 rounded-lg bg-[#fafafa] text-sm text-ink-sub">
              <li>서비스 이후 금액이 전달 되니 안전하게 거래하세요.</li>
              <li>견적서와 계약서는 블록체인을 통해 평생 안전히 보관됩니다.</li>
            </ul>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-20">
        <ServiceSection title={["재방문율이", "높아요"]} loading={loading} posts={revisitPosts} />
        <ServiceSection title={["이웃들이", "많이 찾아요"]} loading={loading} posts={popularPosts} />
      </div>
      <TopButton />
    </div>
  );
}
