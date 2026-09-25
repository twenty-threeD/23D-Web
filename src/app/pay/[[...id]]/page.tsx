"use client";
import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LuChevronLeft, LuCircleAlert } from "react-icons/lu";

import { OnClickPay } from "@/src/components/pay/OnClickPay";
import { ContractPreview } from "@/src/components/pay/ContractPreview";

import { getPost, type Post } from "@/src/lib/post";
import { useAuthStore } from "@/src/store/authStore";
import { parsePostContent } from "@/src/types/priceCard";
import { getContract } from "@/src/lib/contract";
import { useToast } from "@/src/hooks/useToast";
import { getChatRooms, unwrap } from "@/src/lib/chat";
import { getMyProfile } from "@/src/lib/profile";
import { signinPath } from "@/src/lib/navigation";
import type { ChatRoom } from "@/src/store/chatRoomsStore";

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

  const [post, setPost] = useState<Post | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

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

  // 검증을 통과하기 전에는 아무것도 그리지 않는다 (금액·버튼이 잠깐이라도 보이지 않게)
  if (!post || !contract || !contractId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-zinc-400">결제 정보를 확인하는 중...</p>
      </div>
    );
  }

  // 금액은 URL 이 아니라 서버의 계약서 금액만 쓴다 (게시글 플랜 가격은 결제에 절대 쓰지 않는다)
  const price = contract.price;
  const contractUrl = contract.contractUrl;

  // 오른쪽 항목은 계약서 PDF 의 내용을 서버에 저장된 값으로 다시 보여주는 것이다.
  // PDF 는 클라이언트가 그려 올린 파일이라, 둘이 다르면 사용자가 알아채고 신고할 수 있게 나란히 둔다.
  const fields: { label: string; value: string; suffix?: string }[] = [
    { label: "갑", value: contract.clientName },
    { label: "을", value: contract.professionalName },
    { label: "용역 시작일", value: formatDate(contract.startedAt) },
    { label: "용역 종료일", value: formatDate(contract.endedAt) },
    { label: "검수기간", value: String(contract.inspectionPeriod ?? ""), suffix: "일" },
    { label: "계약서 작성일", value: formatDate(contract.createdAt) },
  ];

  return (
    // 넓은 화면에서도 시안의 1280px 콘텐츠 폭을 유지한 채 가운데에 둔다 (마진 대신 부모 정렬로)
    <main className="flex flex-col items-center px-20 pt-12 pb-27.5">
      <div className="flex w-full max-w-320 flex-col gap-9">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 self-start text-[14px] font-medium text-ink-hint cursor-pointer"
        >
          <LuChevronLeft className="size-6" />
          뒤로가기
        </button>

        <div className="flex flex-col gap-12">
          <h1 className="text-[20px] font-semibold text-black">계약서 확인</h1>

          <div className="flex items-start gap-12">
            <div className="w-198.75 shrink-0">
              <ContractPreview contractUrl={contractUrl} token={token} />
            </div>

            <div className="flex w-109.25 flex-col gap-14 pt-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-6">
                  {fields.map((field) => (
                    <div key={field.label} className="flex flex-col gap-3.5">
                      <p className="text-[18px] font-semibold text-ink">{field.label}</p>
                      <div className="flex h-9.5 items-center justify-between rounded-[10px] border border-line px-2.75 text-[12px] font-medium text-ink-hint">
                        <span>{field.value || "-"}</span>
                        {field.suffix && <span>{field.suffix}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <Notice>위 표시되는 내용과 계약서의 내용이 다른 경우 고객센터로 신고 바랍니다.</Notice>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-[14px] font-medium text-ink-hint">총 결제 금액</p>
                    <p className="text-[28px] font-semibold text-ink">{price.toLocaleString()}원</p>
                  </div>
                  <OnClickPay
                    price={price}
                    orderName={post.title ?? "잇다 서비스"}
                    orderCustomerName={username ?? ""}
                    postId={post.id}
                    roomId={String(roomId)}
                    contractUrl={contractUrl}
                    contractId={contractId}
                  />
                </div>
                <Notice>수수료 포함</Notice>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[12px] font-medium text-ink-hint">
      <LuCircleAlert className="size-3 shrink-0" />
      {children}
    </p>
  );
}

// 서버는 LocalDateTime 을 주지만 화면에는 날짜만 필요하다
function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><p className="text-zinc-400">불러오는 중...</p></div>}>
      <PayContent />
    </Suspense>
  );
}
