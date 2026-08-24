"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/src/hooks/useToast";
import { confirmPayment } from "@/src/lib/payment";
import { useAuthStore } from "@/src/store/authStore";

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
    const destination = postId ? `/item/${postId}` : "/main";

    async function run() {
      if (!token || !paymentKey || !orderId || !amount) {
        addToast({ message: "결제 정보를 확인할 수 없습니다.", type: "error" });
        router.replace(destination);
        return;
      }
      try {
        await confirmPayment(token, {
          paymentKey,
          orderId,
          amount: Number(amount),
          // 견적서 결제인 경우에만 함께 보낸다 (승인 후 해당 견적서가 결제완료로 잠긴다)
          ...(estimateId ? { estimateId: Number(estimateId) } : {}),
        });
        addToast({ message: "결제가 완료되었습니다.", type: "success" });
      } catch (e) {
        addToast({ message: e instanceof Error ? e.message : "결제 승인에 실패했습니다.", type: "error" });
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
