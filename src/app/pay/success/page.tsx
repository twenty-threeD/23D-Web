"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/src/hooks/useToast";
import { confirmPayment } from "@/src/lib/payment";
import { ApiError } from "@/src/lib/apiError";
import { useAuthStore } from "@/src/store/authStore";
import { useChatRoomsStore } from "@/src/store/chatRoomsStore";

// 블록체인 기록 실패로 서버가 결제를 자동 취소했을 때 오는 코드.
// (백엔드 PaymentStatusCode.PAYMENT_BLOCKCHAIN_RECORD_FAILED)
const CHAIN_FAILURE_CANCEL_CODE = "PAYMENT_BLOCKCHAIN_RECORD_FAILED";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const postId = searchParams.get("postId");
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const estimateId = searchParams.get("estimateId");
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
          // 견적서 결제인 경우에만 함께 보낸다 (승인 후 해당 견적서가 결제완료로 잠긴다)
          ...(estimateId ? { estimateId: Number(estimateId) } : {}),
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

        // 승인은 됐지만 블록체인 기록에 실패하면 서버가 토스에 취소를 보내고 이 코드로 응답한다.
        // 즉 결제는 이미 환불된 상태다. 완료 때와 같은 대기열에 취소 건으로 넣어 채팅에 알린다.
        // (취소까지 실패한 PAYMENT_CANCEL_FAILED 는 서버 스케줄러가 재시도하는 미결 상태라
        //  아직 취소됐다고 단정할 수 없어 토스트로만 알린다.)
        if (roomId && e instanceof ApiError && e.code === CHAIN_FAILURE_CANCEL_CODE) {
          useChatRoomsStore.getState().setPendingPayment(Number(roomId), {
            orderId,
            orderName: "",
            amount: Number(amount),
            canceled: true,
            reason: e.message,
          });
        }
      } finally {
        router.replace(destination);
      }
    }
    run();
  }, []);

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
