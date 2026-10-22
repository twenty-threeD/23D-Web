"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoConstructOutline } from "react-icons/io5";
import { PAGE_PADDING } from "@/src/lib/layout";

function NoticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "이 페이지";

  return (
    // 버튼만 문구와 더 띄우던 mt-4 를 없애고, 문구 묶음과 버튼 사이 간격을 gap 으로 준다(gap-4 + mt-4 = gap-8)
    <div className="flex flex-col items-center justify-center gap-8 py-32">
      <div className="flex flex-col items-center gap-4">
        <IoConstructOutline className="text-5xl text-zinc-300" />
        <p className="text-lg font-semibold">{title}는 준비 중입니다.</p>
        <p className="text-sm text-zinc-400">빠른 시일 내에 찾아뵙겠습니다.</p>
      </div>
      <button
        onClick={() => router.back()}
        className="px-6 py-2 rounded-xl bg-main text-white text-sm font-semibold transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
      >
        돌아가기
      </button>
    </div>
  );
}

export default function Page() {
  return (
    // 본문 영역이 첫 화면 높이를 채우므로 그 높이 안에서 안내가 가운데에 오게 한다
    <div className={`flex flex-1 flex-col justify-center ${PAGE_PADDING}`}>
      <Suspense fallback={null}>
        <NoticeContent />
      </Suspense>
    </div>
  );
}
