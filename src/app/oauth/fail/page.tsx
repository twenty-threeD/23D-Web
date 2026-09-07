"use client";

import { Suspense } from 'react';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';

import { useRouter, useSearchParams } from 'next/navigation';

// 서버가 /oauth/fail?code=... 로 넘겨주는 실패 사유
const FAIL_MESSAGES: Record<string, string> = {
  OAUTH_PROVIDER_MISMATCH:
    '해당 이메일은 다른 방식으로 가입된 계정입니다. 기존 가입 수단으로 로그인해 주세요.',
};

function OAuthFailContent() {
  const router = useRouter();
  const code = useSearchParams().get('code');
  const message = (code && FAIL_MESSAGES[code]) || '다시 시도해주세요';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <h1 className='text-2xl font-bold'>로그인에 실패했어요 :(</h1>
      <p className='font-medium text-zinc-400 text-center'>{message}</p>
      <button
        onClick={() => router.push('/login/signin')}
        className='px-4 py-2 bg-main text-white text-sm font-semibold rounded-xl transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer'
      >
        다시하기
      </button>
    </div>
  );
}

export default function page () {
  return (
    <div>
      <Header />
      <Suspense fallback={null}>
        <OAuthFailContent />
      </Suspense>
      <Footer />
    </div>
  );
}
