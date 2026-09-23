"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/src/hooks/useToast";
import { confirmPayment } from "@/src/lib/payment";
import { useAuthStore } from "@/src/store/authStore";
import { useChatRoomsStore } from "@/src/store/chatRoomsStore";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  // 승인은 한 번만 보내야 한다. 개발 모드 StrictMode 가 effect 를 두 번 돌려 승인이 중복 요청되면
  // 두 번째가 "이미 처리된 결제"로 실패해 성공한 결제에도 에러 토스트가 뜬다.
  const startedRef = useRef(false);

  useEffect(() => {
    // 토스에서 돌아오면 페이지가 새로 로드되므로, 저장된 로그인 정보를 불러오기 전에 돌면 토큰이 비어 실패한다
    if (!hydrated || startedRef.current) return;
    startedRef.current = true;
    const postId = searchParams.get("postId");
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const roomId = searchParams.get("roomId");
    // 채팅에서 넘어온 결제는 그 방으로 돌려보낸다. 결제 완료 메시지를 보내야 하고,
    // 사용자도 대화 맥락에서 결과를 확인하는 게 자연스럽다.
    const destination = roomId ? `/chat/${roomId}` : postId ? `/item/${postId}` : "/main";

    async function run() {
      if (!token || !paymentKey || !orderId || !amount) {
        addToast({ message: "결제 정보를 확인할 수 없습니다.", type: "error" });
        router.replace(destination);
        return;
      }
      try {
        const res = await confirmPayment(token, {
          paymentKey,
          orderId,
          amount: Number(amount),
        });
        addToast({ message: "결제가 완료되었습니다.", type: "success" });

        // 백엔드는 승인 결과를 응답으로만 주고 채팅 메시지를 만들지 않는다.
        // 계약서와 같은 방식으로 프론트가 채팅에 알린다 —
        // 여기서는 STOMP 연결이 없으므로 대기열에 넣어두고, 채팅 페이지가 연결되면 보낸다.
        if (roomId) {
          const paid = res?.data?.payment;
          useChatRoomsStore.getState().setPendingPayment(Number(roomId), {
            orderId: paid?.orderId ?? orderId,
            orderName: paid?.orderName ?? "",
            amount: Number(paid?.totalAmount ?? amount),
            txHash: res?.data?.blockchainTxHash ?? null,
          });
        }
      } catch (e) {
        addToast({ message: e instanceof Error ? e.message : "결제 승인에 실패했습니다.", type: "error" });
      } finally {
        router.replace(destination);
      }
    }
    run();
    // searchParams·router·addToast 는 바뀌어도 다시 승인하면 안 되므로 로그인 정보 복원만 기다린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-zinc-400">결제 처리 중...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><p className="text-zinc-400">처리 중...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
