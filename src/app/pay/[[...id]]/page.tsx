"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";


import { Estimate } from "@/src/components/pay/Estimate";
import { FinalBill } from "@/src/components/pay/FinalBill";
import { ApplyPay } from "@/src/components/pay/ApplyPay";
import { OnClickPay } from "@/src/components/pay/OnClickPay";

import PriceCard from "@/src/components/PriceCard";
import { getPost, getPostMainImage, type Post } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";
import { parsePostContent } from "@/src/types/priceCard";
import { getContract } from "@/src/lib/contract";
import { useHandleError } from "@/src/hooks/useHandleError";
import { getReviewSummary, type ReviewSummary } from "@/src/lib/review";

const PayContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const token = useAuthStore((s) => s.accessToken);
  const username = useAuthStore((s) => s.username);
  const handleError = useHandleError();

  const [isAgree, setIsAgree] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [contract, setContract] = useState<{ id: number; price: number; contractUrl: string } | null>(null);

  useEffect(() => {
    if (!postId) return;
    getPost(postId, token).then((res) => setPost(res.data ?? null)).catch(() => {});
  }, [postId, token]);

  // 평점은 게시글 응답에 없어 요약 API 로 따로 받는다
  useEffect(() => {
    if (!postId) return;
    getReviewSummary(postId, token)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [postId, token]);

  const { plans } = post ? parsePostContent(post.content) : { plans: [] };

  // 채팅 계약서 플로우(갑↔을 서명 완료)에서 넘어온 경우 contractId 만 받는다.
  // 금액을 URL 에서 읽으면 조작이 가능하고 서버 검증(계약 금액과 1원이라도 다르면 거부)에도 걸리므로,
  // 계약서를 다시 조회해 그 price 를 쓴다 (게시글 플랜 가격은 결제에 절대 쓰지 않는다).
  const queryContractId = Number(searchParams.get("contractId"));
  const contractIdParam = Number.isInteger(queryContractId) && queryContractId > 0 ? queryContractId : null;
  // 문의 시작 때 고른 플랜. 결제 화면에서는 선택이 끝났으므로 이 플랜만 보여준다.
  const selectedPlanName = searchParams.get("plan");
  // 결제 승인 후 이 방으로 돌아가 결제 완료 메시지를 보낸다
  const roomId = searchParams.get("roomId");
  const hasContractQuery = contractIdParam !== null;

  useEffect(() => {
    if (!token || !contractIdParam) return;
    getContract(token, contractIdParam).then(setContract).catch(handleError);
  }, [token, contractIdParam]);

  const contractLoading = hasContractQuery && contract?.id !== contractIdParam;

  const price = contract?.price ?? 0;
  const contractUrl = contract?.contractUrl;

  // post를 올린 사람이 을(파는 쪽, 대금을 받는 "능력자")이다. 문의해서 들어온 사람이 갑(결제하는 쪽).
  const expertName = post?.member?.name ?? post?.member?.username ?? "";
  const postAuthorUsername = post?.member?.username;
  const imgPath = getPostMainImage(post?.fileUrls) ?? "/profile.png";

  return (
    <div>
      <main className="flex flex-col gap-4 justify-center py-8 px-20">
        <div className="w-full">
          <h1 className="text-[24px] font-bold">견적서 확인</h1>
        </div>

        <div className="flex items-start gap-10 justify-between">
          <div className="flex-1 min-w-0">
          <Estimate
            imgPath={imgPath}
            title={post?.title ?? ""}
            expertName={expertName}
            serviceCategory={post?.category?.fullName ?? undefined}
            avgRating={reviewSummary?.averageRating}
            reviewCount={reviewSummary?.reviewCount}
          />
          </div>
          <div className="pr-25">
            <FinalBill
              defaultAmount={price}
            />
          </div>
        </div>

        <div className="flex items-start gap-10 justify-between">
          <div className="flex-1 min-w-0">
            <PriceCard
              username={postAuthorUsername}
              plans={plans}
              postId={postId ?? undefined}
              showInquiry={false}
              selectedPlanName={selectedPlanName}
            />
          </div>
          <div className="pr-25">
            <ApplyPay isAgree={isAgree} setIsAgree={setIsAgree} />
            {!hasContractQuery ? (
              <p className="w-87.5 mt-5 py-3 text-center text-sm text-zinc-500">
                결제할 계약서를 찾을 수 없습니다.
                <br />
                채팅방에서 계약을 체결한 뒤 결제하기 버튼을 눌러주세요.
              </p>
            ) : contractLoading ? (
              <p className="w-87.5 mt-5 py-3 text-center text-sm text-zinc-400">
                계약서를 불러오는 중입니다...
              </p>
            ) : (
              <OnClickPay
                isAgree={isAgree}
                price={price}
                orderName={post?.title ?? "잇다 서비스"}
                orderCustomerName={username ?? ""}
                postId={postId ?? undefined}
                roomId={roomId}
                contractUrl={contractUrl}
                contractId={contractIdParam}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><p className="text-zinc-400">불러오는 중...</p></div>}>
      <PayContent />
    </Suspense>
  );
}
