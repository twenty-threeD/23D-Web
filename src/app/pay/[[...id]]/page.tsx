"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import { Estimate } from "@/src/components/pay/Estimate";
import { FinalBill } from "@/src/components/pay/FinalBill";
import { ApplyPay } from "@/src/components/pay/ApplyPay";
import { OnClickPay } from "@/src/components/pay/OnClickPay";

import PriceCard from "@/src/components/PriceCard";
import { getPost, type Post } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";
import { type PriceCardPlan } from "@/src/types/priceCard";

function parsePlan(content: string): { description: string; plan?: PriceCardPlan } {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && "description" in parsed) return parsed;
  } catch {}
  return { description: content };
}

const Page = () => {
  const params = useParams();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const token = useAuthStore((s) => s.accessToken);
  const username = useAuthStore((s) => s.username);

  const [isAgree, setIsAgree] = useState(false);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!postId) return;
    getPost(postId, token).then((res) => setPost(res.data ?? null)).catch(() => {});
  }, [postId, token]);

  const { plan } = post ? parsePlan(post.content) : { plan: undefined };

  const price = plan?.price ? Number(plan.price.replace(/,/g, "")) : 0;
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
          <PriceCard username={expertUsername} plan={plan} />
          <div className="pr-25">
            <ApplyPay isAgree={isAgree} setIsAgree={setIsAgree} />
            <OnClickPay
              isAgree={isAgree}
              price={price}
              orderName={post?.title ?? "잇다 서비스"}
              orderCustomerName={username ?? ""}
              postId={postId ?? undefined}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Page;
