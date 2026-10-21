"use client";
import Image from "next/image"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function LandingHeader() {
  // 첫 접속 때 바로 메뉴를 쓸 수 있어야 하므로 기본은 보인다.
  // 예전에는 첫 화면(이미지 시퀀스) 구간 내내 숨겼는데, 그 구간으로 돌아오면 헤더를 꺼낼 방법이 없어 걷어 냈다
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        // 아래로 내릴 때 숨고 위로 올릴 때 나온다. 맨 위에서는 iOS 바운스로 y 가 흔들려도 항상 보이게 한다
        if (y <= 0) setVisible(true)
        else if (y !== lastY.current) setVisible(y < lastY.current)
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
