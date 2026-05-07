import Link from "next/link";
import { FaInstagram } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <div className="bg-zinc-100 flex flex-col px-20 py-8 gap-8 border-t border-zinc-200 text-zinc-500">
      <div className="flex gap-16">
        {/* 1 */}
        <div className="flex flex-col gap-4">
          <img src="/icon.png" alt="Logo" className="w-12" />
          <div className="flex flex-col">
            <p className="text-sm">당신의 소중한 커리어를 안전하게 증명하고</p>
            <p className="text-sm">최적의 전문가를 이어주는 '잇다'입니다.</p>
          </div>
          <div className="flex gap-2">
            <FaInstagram className="text-zinc-500 w-10 h-10 border-2 border-zinc-500 rounded-lg p-1" />
            <FaGithub className="text-zinc-500 w-10 h-10 border-2 border-zinc-500 rounded-lg p-1" />
          </div>
        </div>

        {/* 2 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-black text-xl font-bold">빠른 링크</h3>
          <ul className="flex flex-col gap-1">
            <li className="text-sm">
              <Link href="/">프로젝트 소개</Link>
            </li>
            <li className="text-sm">
              <Link href="/">문의하기</Link>
            </li>
            <li className="text-sm">
              <Link href="/">커뮤니티</Link>
            </li>
            <li className="text-sm">
              <Link href="/">팀원 소개</Link>
            </li>
          </ul>
        </div>

        {/* 3 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-black text-xl font-bold">커뮤니티</h3>
          <ul className="flex flex-col gap-1">
            <li className="text-sm">
              <Link href="/">문서</Link>
            </li>
            <li className="text-sm">
              <Link href="/">자주 묻는 질문</Link>
            </li>
            <li className="text-sm">
              <Link href="/">개인정보처리방침</Link>
            </li>
            <li className="text-sm">
              <Link href="/">이용약관</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full h-0.5 bg-zinc-200"></div>
      <p className="text-zinc-300">
        © 2026 ITDA. All rights reserved. ITDA and all associated logos are
        trademarks and/or service marks of ITDA.
      </p>
    </div>
  );
}
