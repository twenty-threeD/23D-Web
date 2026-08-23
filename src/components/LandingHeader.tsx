"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function LandingHeader() {
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
        setVisible(y <= 0 || y < lastY.current)
        lastY.current = y
        ticking.current = false
      })
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-between h-16 px-20 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <Link href="/">
        <img src="/icon.png" alt="Logo" className="h-7" />
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/login/signin" className="text-zinc-500 text-sm font-semibold">
          로그인
        </Link>
        <Link
          href="/main"
          className="bg-main text-white text-sm font-bold py-2 px-5 rounded-full hover:bg-black transition-colors"
        >
          시작하기
        </Link>
      </div>
    </div>
  );
}
