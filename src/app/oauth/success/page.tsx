"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import { reissueToken } from "@/src/lib/auth";

export default function Page() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  // StrictMode의 이펙트 2회 실행으로 재발급이 두 번 나가지 않게 막는다
  // (리프레시 토큰이 회전되면 두 번째 호출이 실패한다)
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // 액세스 토큰은 더 이상 쿼리파라미터로 오지 않는다(히스토리·Referer 유출 방지).
    // 서버가 심은 httpOnly 쿠키로 재발급을 받아 액세스 토큰 문자열을 확보한다.
    // 이 앱은 모든 API를 Authorization 헤더로 호출하고 username·role도 JWT에서 꺼내 쓰므로
    // 로그인 확인만으로는 부족하고 토큰 자체가 필요하다.
    reissueToken()
      .then((token) => {
        setToken(token);
        router.replace("/main");
      })
      .catch(() => router.replace("/oauth/fail"));
  }, [router, setToken]);

  return (
    <>
      <h1>로그인에 성공하였습니다!</h1>
      <p>메인페이지로 이동합니다...</p>
    </>
  );
}
