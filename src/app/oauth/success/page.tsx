"use client";

import { Suspense, useEffect } from "react";
import { useAuthStore } from "@/src/store/authStore";
import { useSearchParams, useRouter } from "next/navigation";

function OAuthSuccessContent() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("accessToken");
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    if (accessToken) {
      setToken(accessToken);
      router.push("/main");
    } else {
      router.push("/oauth/fail");
    }
  }, [accessToken, router, setToken]);

  return (
    <>
      <h1>로그인에 성공하였습니다!</h1>
      <p>메인페이지로 이동합니다...</p>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OAuthSuccessContent />
    </Suspense>
  );
}