"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import { Estimate } from "@/src/components/pay/Estimate";
import { FinalBill } from "@/src/components/pay/FinalBill";
import { ApplyPay } from "@/src/components/pay/ApplyPay";
import { OnClickPay } from "@/src/components/pay/OnClickPay";

import PriceCard from "@/src/components/PriceCard";
import { getPost, type Post } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";
import { parsePostContent } from "@/src/types/priceCard";
import { getEstimates, type Estimate as EstimateData } from "@/src/lib/estimate";
import { useHandleError } from "@/src/hooks/useHandleError";

const PayContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const token = useAuthStore((s) => s.accessToken);
  const username = useAuthStore((s) => s.username);
  const handleError = useHandleError();

  const [isAgree, setIsAgree] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  // 조회를 끝낸 게시글 번호. 로딩 여부는 이 값으로 파생시킨다
  // (effect 안에서 동기적으로 setState 하지 않기 위함).
  const [loadedPostId, setLoadedPostId] = useState<number | null>(null);

  useEffect(() => {
    if (!postId) return;
    getPost(postId, token).then((res) => setPost(res.data ?? null)).catch(() => {});
  }, [postId, token]);

  // 결제 대상 견적서를 찾는다. 아직 결제되지 않은 것 중 가장 최근 것을 사용한다.
  useEffect(() => {
    if (!token || !postId) return;
    getEstimates(token, postId)
      .then((list) => {
        const target = list
          .filter((e) => e.status !== "PAID")
          .sort((a, b) => b.id - a.id)[0];
        setEstimate(target ?? null);
      })
      .catch(handleError)
      .finally(() => setLoadedPostId(postId));
  }, [token, postId]);

  const estimateLoading = Boolean(token && postId) && loadedPostId !== postId;

  const { plans } = post ? parsePostContent(post.content) : { plans: [] };

  // 채팅 계약서 플로우(갑↔을 서명 완료)에서 넘어온 경우, 그 쪽 price/contractUrl을 우선 사용한다.
  // 없으면 기존처럼 견적서 하나를 근거로 삼는다 (게시글 플랜 가격은 결제에 절대 쓰지 않는다).
  const queryPrice = searchParams.get("price");
  const queryContractUrl = searchParams.get("contractUrl");
  const hasContractQuery = queryPrice !== null && queryContractUrl !== null;

  const price = hasContractQuery ? Number(queryPrice) : (estimate?.totalPay ?? 0);
  const contractUrl = hasContractQuery ? queryContractUrl : estimate?.url;

  // post를 올린 사람이 을(파는 쪽, 대금을 받는 "능력자")이다. 문의해서 들어온 사람이 갑(결제하는 쪽).
  const expertName = post?.member?.name ?? post?.member?.username ?? "";
  const postAuthorUsername = post?.member?.username;
  const imgPath = post?.fileUrls?.[0] ?? "/profile.png";

  return (
    <div>
      <Header />
      <main className="flex flex-col gap-4 justify-center py-8 px-20">
        <div className="w-full">
          <h1 className="text-[24px] font-bold">견적서 확인</h1>
        </div>

        <div className="flex items-start gap-10 justify-between">
          <Estimate
            imgPath={imgPath}
            title={post?.title ?? ""}
            expertName={expertName}
          />
          <div className="pr-25">
            <FinalBill
              defaultAmount={price}
            />
          </div>
        </div>

        <div className="flex items-start gap-10 justify-between">
          <PriceCard username={postAuthorUsername} plans={plans} postId={postId ?? undefined} />
          <div className="pr-25">
            <ApplyPay isAgree={isAgree} setIsAgree={setIsAgree} />
            {hasContractQuery ? (
              <OnClickPay
                isAgree={isAgree}
                price={price}
                orderName={post?.title ?? "잇다 서비스"}
                orderCustomerName={username ?? ""}
                postId={postId ?? undefined}
                contractUrl={contractUrl}
              />
            ) : estimateLoading ? (
              <p className="w-87.5 mt-5 py-3 text-center text-sm text-zinc-400">
                견적서를 불러오는 중입니다...
              </p>
            ) : estimate ? (
              <OnClickPay
                isAgree={isAgree}
                price={price}
                orderName={post?.title ?? "잇다 서비스"}
                orderCustomerName={username ?? ""}
                postId={postId ?? undefined}
                contractUrl={contractUrl}
                estimateId={estimate.id}
              />
            ) : (
              <p className="w-87.5 mt-5 py-3 text-center text-sm text-zinc-500">
                견적서가 아직 발행되지 않았습니다.
                <br />
                전문가에게 견적서를 요청해주세요.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
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
