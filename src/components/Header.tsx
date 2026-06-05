"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Search from "./Search";

export default function Header() {
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();
  const isPostPage = pathname === "/community";

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTop = scrollY === 0;

  return (
    <div className={`sticky top-0 z-10 bg-white flex items-center justify-between h-16 px-20 ${!isTop ? "border-b border-zinc-300" : ""}`}>
      {/* 로고 / 리스트 */}
      <div className="flex gap-8 items-center">
        <Link href="/main">
          <img src="/icon.png" alt="Logo" className="h-7"/>
        </Link>
        <ul className="flex gap-4">
          <li><Link href="/" className="text-zinc-500 text-sm font-semibold ">견적요청</Link></li>
          <li><Link href="/" className="text-zinc-500 text-sm font-semibold">능력자 찾기</Link></li>
          <li><Link href="/community" className="text-zinc-500 text-sm font-semibold">커뮤니티</Link></li>
        </ul>
      </div>

      {/* 검색창 */}
      <Search isTop={isPostPage ? true : isTop} where="header" />

      {/* 로그인 */}
      <Link href="/login/signin" className="text-zinc-500 text-sm font-semibold">
        로그인 / 회원가입
      </Link>
    </div>
  );
}