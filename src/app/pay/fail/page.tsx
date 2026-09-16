"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoWarningOutline } from "react-icons/io5";
import { useChatRoomsStore } from "@/src/store/chatRoomsStore";

// 사용자가 결제창을 직접 닫거나 취소했을 때 토스가 주는 코드.
// 이 경우에만 '취소'로 보고, 나머지는 결제 오류로 둔다 (채팅에 취소로 남기면 사실과 다르다).
const USER_CANCEL_CODE = "PAY_PROCESS_CANCELED";

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");
  const roomId = searchParams.get("roomId");
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const canceled = code === USER_CANCEL_CODE;

  // 채팅에서 넘어온 결제라면 그 방으로 돌려보낸다. 상대도 결과를 알아야 하므로
  // 결제 완료와 같은 방식으로 대기열에 넣어두고, 채팅 페이지가 STOMP 에 연결되면 보낸다.
  useEffect(() => {
    if (!roomId || !canceled) return;
    useChatRoomsStore.getState().setPendingPayment(Number(roomId), {
      orderId: searchParams.get("orderId") ?? "",
      orderName: searchParams.get("orderName") ?? "",
      amount: Number(searchParams.get("amount") ?? 0),
      canceled: true,
      reason: message,
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <IoWarningOutline className="text-5xl text-red-400" />
      <p className="text-lg font-semibold">
        {canceled ? "결제가 취소되었습니다." : "결제에 실패했습니다."}
      </p>
      <p className="text-sm text-zinc-400">
        {message || "결제가 취소되었거나 오류가 발생했습니다."}
      </p>
      <button
        onClick={() =>
          router.replace(roomId ? `/chat/${roomId}` : postId ? `/pay/${postId}` : "/main")
        }
        className="px-6 py-2 rounded-xl bg-main text-white text-sm font-semibold transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
      >
        {roomId ? "채팅방으로 돌아가기" : "돌아가기"}
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><p className="text-zinc-400">처리 중...</p></div>}>
      <FailContent />
    </Suspense>
  );
}
