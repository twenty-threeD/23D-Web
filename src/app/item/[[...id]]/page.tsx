"use client";

import Image from "next/image"
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PriceCard from "@/src/components/PriceCard";
import InquiryButton from "@/src/components/item/InquiryButton";
import Review from "@/src/components/Review";
import StarRating from "@/src/components/StarRating";
import TopButton from "@/src/components/TopButton";
import ServiceSection, { SECTION_INSET } from "@/src/components/main/ServiceSection";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { IoChevronDownOutline } from "react-icons/io5";
import { getPost, getPosts, favoritePost, unfavoritePost, getFavoritePosts, type Post } from "@/src/lib/post"
import { parsePostContent } from "@/src/types/priceCard";
import { useAuthStore } from "@/src/store/authStore";
import { useHandleError } from "@/src/hooks/useHandleError";
import { useToast } from "@/src/hooks/useToast";
import { ApiError } from "@/src/lib/apiError";
import { toRelativeUrl } from "@/src/lib/file"
import ImageLightbox from "@/src/components/ImageLightbox"
import ReviewAnalysis from "@/src/components/item/ReviewAnalysis"
import { createReview, getReviews, getReviewableContracts, type Review as ReviewData, type ReviewableContract } from "@/src/lib/review"
import { signinPath } from "@/src/lib/navigation"

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const token = useAuthStore((s) => s.accessToken);
  const myUsername = useAuthStore((s) => s.username);
  const handleError = useHandleError();
  const { addToast } = useToast();
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
  // 후기는 글이 아니라 계약 단위로 남는다. 서버가 "지금 후기를 쓸 수 있는 내 계약"만 골라주므로
  // 이 목록이 비어 있으면 폼을 숨기고, 여러 건이면 어느 전문가와의 계약인지 고르게 한다
  const [reviewableContracts, setReviewableContracts] = useState<ReviewableContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  // 목록이 바뀌면(후기를 써서 하나 빠짐 등) 고른 계약이 사라질 수 있어, 그때는 가장 최근 계약으로 본다
  const activeContractId =
    reviewableContracts.some((c) => c.contractId === selectedContractId)
      ? selectedContractId
      : reviewableContracts[0]?.contractId ?? null;
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
    // 비로그인이면 서버가 401 을 주므로 묻지 않는다. 조회에 실패해도 폼만 숨기면 되는 값이라 조용히 비운다
    if (!token || !postId) return;
    getReviewableContracts(token, postId)
      .then(setReviewableContracts)
      .catch(() => setReviewableContracts([]));
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
    if (activeContractId === null) return;

    const content = reviewContent.trim();
    if (!content) return;

    setReviewBusy(true);
    try {
      const created = await createReview(token, {
        contractId: activeContractId,
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
      // 한 계약에는 후기를 한 번만 쓸 수 있어 방금 쓴 계약을 목록에서 뺀다. 남은 계약이 없으면 폼이 사라진다
      setReviewableContracts((current) => current.filter((c) => c.contractId !== activeContractId));
      setReviewContent("");
      setReviewRating(5);
    } catch (e) {
      // 버튼은 결제를 마친 계약에만 보이지만, 그 사이 결제가 취소되면 서버가 막는다. 공통 처리보다 구체적으로 안내한다
      if (e instanceof ApiError && e.code === "REVIEW_PAYMENT_REQUIRED") {
        addToast({ message: "결제가 완료된 계약만 리뷰를 작성할 수 있습니다.", type: "error" });
        return;
      }
      handleError(e);
    } finally {
      setReviewBusy(false);
    }
  }

  const { description, plans } = post ? parsePostContent(post.content) : { description: "", plans: [] };
  const isOwner = !!(post?.member?.username && myUsername && post.member.username === myUsername);
  // 의뢰인 여부 · 결제 완료 · 이미 쓴 후기는 서버가 목록에서 이미 걸렀다.
  // 예전처럼 작성자 이름으로 "이미 썼는지" 를 다시 보면, 같은 글에 계약이 두 건일 때 두 번째 후기를 못 쓰게 된다
  // 로그아웃하면 이전 계정의 목록이 남지 않도록 토큰이 있을 때만 쓴다
  const myReviewableContracts = token ? reviewableContracts : [];
  const canReview = myReviewableContracts.length > 0;
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
    <div className="flex flex-col gap-20 lg:gap-40 pt-8 lg:pt-[52px] pb-24 overflow-x-clip">
      {/* 휴대폰 하단 문의 바는 이 묶음 안에서만 화면 아래에 붙는다.
          본문을 다 보고 아래 '비슷한 서비스' 로 넘어가면 묶음이 끝나 바가 본문 끝 제자리에 멈춘다 */}
      <div className="flex flex-col gap-10">
        {/* 좌우 여백은 /main 과 같은 규칙(SECTION_INSET)을 써서 두 화면의 본문 시작선을 맞춘다 */}
        <div className={`flex flex-col gap-[52px] w-full ${SECTION_INSET}`}>
        <div className="relative w-full h-[180px] md:h-[260px] rounded-2xl overflow-hidden bg-zinc-200">
          {/* 기존 대체 이미지(/profile_banner.png)는 public 에 없어 깨져 보였다. 이미지가 없으면 회색 배경만 둔다 */}
          {headerImage && (
            <Image
              src={toRelativeUrl(headerImage)}
              alt="서비스 헤더 이미지"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              className="object-cover"
            />
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
                    // 휴대폰에서는 하단 문의 바에 찜 버튼이 있어 여기서는 숨긴다
                    <button
                      onClick={handleToggleFavorite}
                      disabled={favoriteBusy}
                      className="hidden lg:block shrink-0 p-1 disabled:opacity-50 cursor-pointer"
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
                        className="relative size-48 rounded-xl overflow-hidden bg-zinc-200 transition-opacity hover:opacity-90 cursor-pointer"
                        onClick={() => setLightboxSrc(toRelativeUrl(url))}
                      >
                        <Image src={toRelativeUrl(url)} alt={`이미지 ${i + 1}`} fill sizes="192px" className="object-cover" />
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

                {/* 리뷰 요약은 글이 아니라 전문가(회원) 단위라 작성자 id 로 조회한다 */}
                {post?.member?.id != null && <ReviewAnalysis memberId={post.member.id} />}

                {/* 후기는 이 글에서 내가 의뢰인으로 결제까지 마친 계약에만, 계약당 한 번 남길 수 있다 */}
                {canReview && (
                  <div className="flex flex-col gap-3 p-5 rounded-xl bg-[#fafafa]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">후기 남기기</h3>
                      <div className="flex items-center gap-2">
                        <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                        <span className="text-sm font-semibold text-ink-sub">{reviewRating}.0</span>
                      </div>
                    </div>
                    {/* 계약이 하나면 고를 게 없어 감춘다. 같은 전문가와 여러 번 계약했을 수 있어 계약일을 같이 보여준다 */}
                    {myReviewableContracts.length > 1 && (
                      <div className="relative h-[38px] rounded-lg border border-[#d8d8d8] bg-white text-sm">
                        <select
                          value={activeContractId ?? ""}
                          onChange={(e) => setSelectedContractId(Number(e.target.value))}
                          aria-label="후기를 남길 계약 선택"
                          className="size-full appearance-none bg-transparent px-3 pr-9 cursor-pointer focus:outline-none"
                        >
                          {myReviewableContracts.map((c) => (
                            <option key={c.contractId} value={c.contractId}>
                              {c.professionalName}
                              {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleDateString("ko-KR")} 계약` : ""}
                            </option>
                          ))}
                        </select>
                        <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none text-ink-sub" />
                      </div>
                    )}
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
                  <p className="font-medium text-[#838383]">아직 작성된 리뷰가 없어요.</p>
                )}
              </div>
            </div>

            {/* right content */}
            <div className="order-1 lg:order-2 flex flex-col gap-2 w-full lg:w-[340px] xl:w-[380px] shrink-0 lg:sticky lg:top-24">
              {/* 휴대폰에서는 문의하기를 하단 고정 바로 옮겨, 카드 안 버튼은 데스크톱에서만 보인다 */}
              <PriceCard username={post?.member?.username} plans={plans} postId={postId ?? undefined} inquiryClassName="hidden lg:block" />
              <ul className="flex flex-col list-disc pl-[25px] pr-4 py-5 rounded-lg bg-[#fafafa] text-sm text-ink-sub">
                <li>서비스 이후 금액이 전달 되니 안전하게 거래하세요.</li>
                <li>견적서와 계약서는 블록체인을 통해 평생 안전히 보관됩니다.</li>
              </ul>
            </div>
          </div>

        </div>

        {!isOwner && (
          <div className="lg:hidden sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-zinc-200 bg-white px-5 md:px-10 py-3">
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoriteBusy}
              aria-label="찜하기"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#d8d8d8] disabled:opacity-50 cursor-pointer"
            >
              {isFavorited ? <IoMdHeart className="text-2xl text-main" /> : <IoMdHeartEmpty className="text-2xl text-main" />}
            </button>
            <InquiryButton username={post?.member?.username} postId={postId ?? undefined} plans={plans} className="h-11" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-20">
        <ServiceSection title={["재방문율이", "높아요"]} loading={loading} posts={revisitPosts} />
        <ServiceSection title={["이웃들이", "많이 찾아요"]} loading={loading} posts={popularPosts} />
      </div>
      <TopButton />
    </div>
  );
}
