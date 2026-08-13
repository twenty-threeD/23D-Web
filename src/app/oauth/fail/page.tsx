"use client";

import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';

import { useRouter } from 'next/navigation';

export default function page () {
  const router = useRouter();
  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <h1 className='text-2xl font-bold'>로그인에 실패했어요 :(</h1>
        <p className='font-medium text-zinc-400'>다시 시도해주세요</p>
        <button
          onClick={() => router.push('/login/signin')}
          className='px-4 py-2 bg-main text-white font-bold rounded-md hover:bg-orange-600 transition-colors'
        >
          다시하기
        </button>
      </div>
      <Footer />
    </div>
  );
}