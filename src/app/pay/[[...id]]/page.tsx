"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";


import { Estimate } from "@/src/components/pay/Estimate";
import { FinalBill } from "@/src/components/pay/FinalBill";
import { ApplyPay } from "@/src/components/pay/ApplyPay";
import { OnClickPay } from "@/src/components/pay/OnClickPay";

import PriceCard from "@/src/components/PriceCard";
import { getPost, getPostMainImage, type Post } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";
import { parsePostContent } from "@/src/types/priceCard";
import { getContract } from "@/src/lib/contract";
import { useToast } from "@/src/hooks/useToast";
import { getChatRooms, unwrap } from "@/src/lib/chat";
import { getMyProfile } from "@/src/lib/profile";
import { signinPath } from "@/src/lib/navigation";
import type { ChatRoom } from "@/src/store/chatRoomsStore";
import { getReviewSummary, type ReviewSummary } from "@/src/lib/review";

type Contract = Awaited<ReturnType<typeof getContract>>;

function toPositiveInt(value: string | null | undefined) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const PayContent = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const username = useAuthStore((s) => s.username);

  const postId = toPositiveInt(Array.isArray(params.id) ? params.id[0] : params.id);
  const contractId = toPositiveInt(searchParams.get("contractId"));
  // 결제 승인 후 이 방으로 돌아가 결제 완료 메시지를 보낸다
  const roomId = toPositiveInt(searchParams.get("roomId"));
  // 문의 시작 때 고른 플랜. 결제 화면에서는 선택이 끝났으므로 이 플랜만 보여준다.
  const selectedPlanName = searchParams.get("plan");

  const [isAgree, setIsAgree] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);

  // URL 의 postId·contractId·roomId·plan 은 누구나 고쳐 칠 수 있다.
  // 서버 prepare 도 금액을 검증하지만 그건 결제하기를 눌러야 드러나므로,
  // 진입 시점에 서로가 한 건으로 맞물리는지 확인하고 하나라도 어긋나면 화면을 보여주지 않고 돌려보낸다.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const reject = (message: string) => {
      if (cancelled) return;
      addToast({ message, type: "error" });
      router.replace(roomId ? `/chat/${roomId}` : "/chat");
    };

    if (!token) {
      router.replace(signinPath());
      return;
    }
    // 계약 체결 없이(쿼리 없이) 들어오는 경로 자체를 막는다
    if (!postId || !contractId || !roomId) {
      reject("잘못된 결제 경로입니다. 채팅방에서 계약을 체결한 뒤 결제해주세요.");
      return;
    }

    (async () => {
      try {
        const [postRes, contractData, roomsJson, profileRes] = await Promise.all([
          getPost(postId, token),
          getContract(token, contractId),
          getChatRooms(token),
          getMyProfile(token),
        ]);
        if (cancelled) return;

        const targetPost: Post | null = postRes.data ?? null;
        const rooms = unwrap<ChatRoom[]>(roomsJson) ?? [];
        const room = Array.isArray(rooms) ? rooms.find((r) => r.roomId === roomId) : undefined;
        const myMemberId = profileRes.data?.memberId;
        const myUsername = profileRes.data?.username;
        const seller = targetPost?.member?.username;

        const plans = targetPost ? parsePostContent(targetPost.content).plans : [];
        const planMatches = !selectedPlanName || plans.some((p) => p.planName === selectedPlanName);

        const valid =
          targetPost !== null &&
          room !== undefined &&
          // 방이 이 게시글에서 시작된 것이어야 한다
          room.postId === postId &&
          // 갑/을은 방마다 정해진다: 글 작성자가 을, 나는 갑이어야 결제할 수 있다
          !!seller && seller !== myUsername && seller === room.participantUsername &&
          // 계약서 당사자가 정확히 이 방의 나(갑)와 상대(을)여야 한다
          !!myMemberId && contractData.clientId === myMemberId &&
          !!room.participantId && contractData.professionalId === room.participantId &&
          planMatches;

        if (!valid) {
          reject("결제 정보가 일치하지 않습니다. 채팅방의 결제하기 버튼으로 다시 시도해주세요.");
          return;
        }
        setPost(targetPost);
        setContract(contractData);
      } catch {
        // 남의 계약서·없는 게시글 등은 서버가 403/404 로 거절한다
        reject("결제 정보를 확인할 수 없습니다. 채팅방의 결제하기 버튼으로 다시 시도해주세요.");
      }
    })();

    return () => { cancelled = true };
    // addToast·router 는 매 렌더 새로 만들어져 넣으면 검증이 반복 실행된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token, postId, contractId, roomId, selectedPlanName]);

  // 평점은 게시글 응답에 없어 요약 API 로 따로 받는다. 요약은 글 작성자(을) 기준이다
  useEffect(() => {
    const memberId = post?.member?.id;
    if (!memberId) return;
    getReviewSummary(memberId, token)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [post, token]);

  // 검증을 통과하기 전에는 아무것도 그리지 않는다 (금액·버튼이 잠깐이라도 보이지 않게)
  if (!post || !contract || !contractId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-zinc-400">결제 정보를 확인하는 중...</p>
      </div>
    );
  }

  const { plans } = parsePostContent(post.content);
  // 금액은 URL 이 아니라 서버의 계약서 금액만 쓴다 (게시글 플랜 가격은 결제에 절대 쓰지 않는다)
  const price = contract.price;
  const contractUrl = contract.contractUrl;

  // post를 올린 사람이 을(파는 쪽, 대금을 받는 "능력자")이다. 문의해서 들어온 사람이 갑(결제하는 쪽).
  const expertName = post.member?.name ?? post.member?.username ?? "";
  const postAuthorUsername = post.member?.username;
  const imgPath = getPostMainImage(post.fileUrls) ?? "/profile.png";

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
            title={post.title ?? ""}
            expertName={expertName}
            serviceCategory={post.category?.fullName ?? undefined}
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
              postId={post.id}
              showInquiry={false}
              selectedPlanName={selectedPlanName}
            />
          </div>
          <div className="pr-25">
            <ApplyPay isAgree={isAgree} setIsAgree={setIsAgree} />
            <OnClickPay
              isAgree={isAgree}
              price={price}
              orderName={post.title ?? "잇다 서비스"}
              orderCustomerName={username ?? ""}
              postId={post.id}
              roomId={String(roomId)}
              contractUrl={contractUrl}
              contractId={contractId}
            />
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
