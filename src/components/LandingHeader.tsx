"use client";
import Image from "next/image"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LETTERBOX_EVENT, type LetterboxDetail } from "@/src/lib/letterbox";

export default function LandingHeader() {
  const [visible, setVisible] = useState(true);
  // 첫 화면(영상 위 레터박스)에서는 사진이 비쳐야 해서 투명하게 두고, 그 밖에서는 흰 바탕을 깐다.
  // 바탕이 없으면 어두운 섹션 위에서 검은 로고가 보이지 않는다
  const [onHero, setOnHero] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);
  // 영상 섹션의 위쪽 레터박스로 쓰이는 중인지. 그동안에는 스크롤로 숨지 않는다.
  const letterbox = useRef(false);

  // 아래 띠와 같은 순간에 같이 물러나야 해서, 영상 섹션이 보내는 신호를 그대로 따른다.
  useEffect(() => {
    const handleLetterbox = (event: Event) => {
      const { active } = (event as CustomEvent<LetterboxDetail>).detail;
      letterbox.current = active;
      setVisible(active);
      setOnHero(active);
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
        // 레터박스로 쓰이는 동안에는 숨지 않는다. 숨으면 위쪽 띠가 통째로 사라진다.
        setVisible(letterbox.current || y <= 0 || y < lastY.current)
        lastY.current = y
        ticking.current = false
      })
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      // 레이아웃에서 빠져 영상 위에 떠 있어야 한다. sticky 면 첫 화면이 헤더 높이만큼 밀린다.
      // 이 띠가 곧 영상 섹션의 위쪽 레터박스다. 아래 띠도 같은 h-16 으로 맞춰져 있다.
      className={`fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-5 md:px-10 xl:px-20 backdrop-blur-md transition-all duration-300 ${onHero ? "" : "bg-white/80 border-b border-line"} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      {/* 사이트 헤더와 같은 투명 배경 로고. 첫 화면에서는 어두운 사진 위라 흰색으로 뒤집는다 */}
      <Link href="/">
        <Image src="/logo.png" alt="잇다" width={42} height={28} className={`block h-7 w-[42px] transition-[filter] duration-300 ${onHero ? "brightness-0 invert" : ""}`} />
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/login/signin" className={`text-sm font-semibold transition-colors duration-300 ${onHero ? "text-white/80 hover:text-white" : "text-zinc-500 hover:text-ink"}`}>
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
