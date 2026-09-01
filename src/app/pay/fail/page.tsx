"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoWarningOutline } from "react-icons/io5";

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");
  const message = searchParams.get("message");

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <IoWarningOutline className="text-5xl text-red-400" />
      <p className="text-lg font-semibold">결제에 실패했습니다.</p>
      <p className="text-sm text-zinc-400">{message || "결제가 취소되었거나 오류가 발생했습니다."}</p>
      <button
        onClick={() => router.replace(postId ? `/pay/${postId}` : "/main")}
        className="mt-4 px-6 py-2 rounded-xl bg-main text-white text-sm font-semibold transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
      >
        돌아가기
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
