"use client"

import { useRef, useEffect } from 'react'
import Link from 'next/link';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  const handle = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      handle.current?.style && (handle.current.style.transform = `translateY(${Math.sin(Date.now() / 300) * 10}px)`)
    }, 16)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <Header/>
      <div className="h-[calc(100vh-64px)] flex flex-col relative items-center justify-center bg-linear-to-b from-white to-[#FFC4BA]">
        <div className="flex flex-col items-center justify-center gap-4 pb-20">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <h1 className="text-4xl font-bold">사람과 사람을</h1>
              <h1 className="text-4xl font-bold text-[#FE6A4C]">잇다</h1>
            </div>
            <div className="flex gap-2">
              <h1 className="text-4xl font-bold">잇다에서</h1>
              <h1 className="text-4xl font-bold text-[#FE6A4C]">쉽고 안전하게</h1>
            </div>
          </div>
          <Link href="/main" className="bg-[#FE6A4C] py-2 px-6 rounded-full">
            <p className="text-white font-bold">무료로 시작하기 →</p>
          </Link>
        </div>

        <img src="/handle.png" alt="" ref={handle} className="absolute bottom-10 transition-transform duration-16 ease-in"/>
      </div>
      <div className="px-20 py-40 flex flex-col font-semibold text-xl text-center">
          <p>내 모든 커리어를 투명하게 증명하고, 믿을수 있는 파트너를 만나세요.</p>
          <div className="flex items-baseline justify-center">
            <p className="mr-1">조작 불가능한</p>
            <p className="text-[#FE6A4C] font-black text-2xl">블록체인</p>
            <p>으로 완성된 가장 안전한 매칭 서비스,</p>
          </div>
          <p>잇다와 함께라면 당신의 비지니스가 더 단단해질 거에요.</p>
        </div>
      <Footer/>
    </div>
  );
}
