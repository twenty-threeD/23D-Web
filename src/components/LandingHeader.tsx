"use client";
import Image from "next/image"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LETTERBOX_EVENT, type LetterboxDetail } from "@/src/lib/letterbox";

export default function LandingHeader() {
  // 첫 화면 구간에는 위아래 검은 레터박스만 두고 헤더를 숨긴다. 시퀀스가 끝났다는 신호를 받으면 나온다
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);
  // 아직 첫 화면(이미지 시퀀스) 구간인지. 그동안에는 스크롤 방향과 상관없이 숨겨 둔다
  const hero = useRef(true);

  useEffect(() => {
    const handleLetterbox = (event: Event) => {
      const { active } = (event as CustomEvent<LetterboxDetail>).detail;
      hero.current = active;
      setVisible(!active);
    };
    window.addEventListener(LETTERBOX_EVENT, handleLetterbox);
    return () => window.removeEventListener(LETTERBOX_EVENT, handleLetterbox);
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        // 첫 화면이 끝난 뒤에는 아래로 내릴 때 숨고, 위로 올릴 때 다시 나온다
        setVisible(!hero.current && y < lastY.current)
        lastY.current = y
        ticking.current = false
      })
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      // 레이아웃에서 빠져 화면 위에 떠 있어야 한다. sticky 면 첫 화면이 헤더 높이만큼 밀린다
      className={`fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/80 px-5 backdrop-blur-md transition-all duration-300 md:px-10 xl:px-20 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <Link href="/">
        <Image src="/logo.png" alt="잇다" width={42} height={28} className="block h-7 w-[42px]" />
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/login/signin" className="text-sm font-semibold text-zinc-500 transition-colors hover:text-ink">
          로그인
        </Link>
        <Link
          href="/main"
          className="bg-main text-white text-sm font-bold py-2 px-5 rounded-full hover:bg-ink transition-colors"
        >
          시작하기
        </Link>
      </div>
    </div>
  );
}
