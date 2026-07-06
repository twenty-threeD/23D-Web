"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/src/hooks/useToast";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  useEffect(() => {
    const postId = searchParams.get("postId");
    addToast({ message: "결제가 완료되었습니다.", type: "success" });
    if (postId) {
      router.replace(`/item/${postId}`);
    } else {
      router.replace("/main");
    }
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
