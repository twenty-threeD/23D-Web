"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoConstructOutline } from "react-icons/io5";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

function NoticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "이 페이지";

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <IoConstructOutline className="text-5xl text-zinc-300" />
      <p className="text-lg font-semibold">{title}는 준비 중입니다.</p>
      <p className="text-sm text-zinc-400">빠른 시일 내에 찾아뵙겠습니다.</p>
      <button
        onClick={() => router.back()}
        className="mt-4 px-6 py-2 rounded-xl bg-main text-white text-sm font-semibold transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
      >
        돌아가기
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={null}>
        <NoticeContent />
      </Suspense>
      <Footer />
    </div>
  );
}
