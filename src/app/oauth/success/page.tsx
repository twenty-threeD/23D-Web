"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import { exchangeOAuthCode, reissueToken } from "@/src/lib/auth";
import { ApiError } from "@/src/lib/apiError";

// App Router 는 쿼리가 바뀌면 페이지를 새로 마운트해서, 주소에서 code 를 지우는 순간 컴포넌트가 다시 뜬다.
// useRef 가드는 새 인스턴스에서 풀려 버려 code 없는 두 번째 실행이 재발급을 부르고, 그게 또 주소를 건드려 요청이 반복됐다.
// 그래서 교환·재발급은 모듈에서 한 번만 시작하고, 몇 번 마운트되든 같은 결과를 기다리게 한다.
// (소셜 로그인은 항상 백엔드 리다이렉트로 새로 페이지를 불러오므로 모듈 상태가 이전 로그인과 섞이지 않는다)
let pendingLogin: Promise<string> | null = null;

function startLogin() {
  if (pendingLogin) return pendingLogin;

  // code 가 있으면 localhost 처럼 .idta.store 밖에서 시작한 로그인이다. 쿠키가 이 오리진에 없으니 코드를 교환해 받는다.
  // 없으면 배포 환경으로, 서버가 이미 심은 httpOnly 쿠키로 재발급해 액세스 토큰 문자열을 확보한다.
  // (이 앱은 모든 API를 Authorization 헤더로 호출하고 username·role도 JWT에서 꺼내 쓰므로 토큰 자체가 필요하다)
  const code = new URLSearchParams(window.location.search).get("code");
  if (code) {
    // 1회용 코드가 히스토리에 남지 않게 지운다
    window.history.replaceState(null, "", "/oauth/success");
  }
  pendingLogin = code ? exchangeOAuthCode(code) : reissueToken();
  return pendingLogin;
}

export default function Page() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    let cancelled = false;
    startLogin()
      .then((token) => {
        if (cancelled) return;
        setToken(token);
        router.replace("/main");
      })
      .catch((e) => {
        // 실패 화면엔 코드만 남아 원인을 알 수 없어서, 개발자 도구에서 볼 수 있게 원본 에러를 남긴다
        console.error("[oauth/success] 로그인 처리 실패", e);
        if (cancelled) return;
        const failCode = e instanceof ApiError && e.code ? `?code=${e.code}` : "";
        router.replace(`/oauth/fail${failCode}`);
      });
    return () => {
      cancelled = true;
    };
  }, [router, setToken]);

  return (
    <>
      <h1>로그인에 성공하였습니다!</h1>
      <p>메인페이지로 이동합니다...</p>
    </>
  );
}
