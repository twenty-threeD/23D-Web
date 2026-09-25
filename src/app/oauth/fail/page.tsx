"use client";

import { Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

// 서버가 /oauth/fail?code=... 로 넘겨주는 실패 사유
const FAIL_MESSAGES: Record<string, string> = {
  OAUTH_PROVIDER_MISMATCH:
    '해당 이메일은 다른 방식으로 가입된 계정입니다. 기존 가입 수단으로 로그인해 주세요.',
  OAUTH_EMAIL_NOT_PROVIDED:
    '소셜 계정에서 이메일을 받지 못했어요. 이메일 제공에 동의한 뒤 다시 시도해 주세요.',
  WITHDRAWN_ACCOUNT: '탈퇴한 계정입니다.',
  // 교환 코드는 60초 1회용이라, 로그인 후 오래 머물렀거나 새로고침하면 만료된다
  INVALID_OAUTH_EXCHANGE_CODE: '로그인 시간이 만료되었어요. 다시 로그인해 주세요.',
};

function OAuthFailContent() {
  const router = useRouter();
  const code = useSearchParams().get('code');
  const message = (code && FAIL_MESSAGES[code]) || '다시 시도해주세요';

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-2">
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

export default function Page() {
  return (
    <div>
      <Suspense fallback={null}>
        <OAuthFailContent />
      </Suspense>
    </div>
  );
}
