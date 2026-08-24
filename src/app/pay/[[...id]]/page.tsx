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

const PayContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const token = useAuthStore((s) => s.accessToken);
  const username = useAuthStore((s) => s.username);

  const [isAgree, setIsAgree] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [estimate, setEstimate] = useState<EstimateData | null>(null);

  useEffect(() => {
    if (!postId) return;
    getPost(postId, token).then((res) => setPost(res.data ?? null)).catch(() => {});
  }, [postId, token]);

  // 결제 대상 견적서를 찾는다.
  // 견적서에는 postId 가 없으므로 게시글 작성자(전문가) 기준으로 매칭하고,
  // 아직 결제되지 않은 것 중 가장 최근 것을 사용한다.
  const professionalId = post?.member?.id;
  useEffect(() => {
    if (!token || !professionalId) return;
    getEstimates(token)
      .then((list) => {
        const target = list
          .filter((e) => e.professionalId === professionalId && !e.paid)
          .sort((a, b) => b.id - a.id)[0];
        setEstimate(target ?? null);
      })
      .catch(() => {});
  }, [token, professionalId]);

  const { plans } = post ? parsePostContent(post.content) : { plans: [] };
  const plan = plans[0];

  // 결제 금액과 계약서 URL 은 견적서를 기준으로 한다.
  const planPrice = plan?.price ? Number(plan.price.replace(/,/g, "")) : 0;
  const price = estimate?.totalPay ?? planPrice;
  const contractUrl = estimate?.url ?? searchParams.get("contractUrl") ?? undefined;
  const expertName = post?.member?.name ?? post?.member?.username ?? "";
  const expertUsername = post?.member?.username;
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
          <PriceCard username={expertUsername} plans={plans} />
          <div className="pr-25">
            <ApplyPay isAgree={isAgree} setIsAgree={setIsAgree} />
            <OnClickPay
              isAgree={isAgree}
              price={price}
              orderName={post?.title ?? "잇다 서비스"}
              orderCustomerName={username ?? ""}
              postId={postId ?? undefined}
              contractUrl={contractUrl}
              estimateId={estimate?.id}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <PayContent />
  </Suspense>
);

export default Page;
