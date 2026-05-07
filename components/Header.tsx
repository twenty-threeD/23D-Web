import Link from "next/link";

export default function Header() {
  return (
    <div className="bg-white flex items-center justify-between h-16 px-20">
      <div className="flex gap-8 items-center">
        <Link href="/">
          <img src="/icon.png" alt="Logo" className="h-7"/>
        </Link>
        <ul className="flex gap-4">
          <li><Link href="/" className="text-zinc-500 text-sm font-semibold">견적요청</Link></li>
          <li><Link href="/" className="text-zinc-500 text-sm font-semibold">능력자 찾기</Link></li>
          <li><Link href="/" className="text-zinc-500 text-sm font-semibold">커뮤니티</Link></li>
        </ul>
      </div>
      <Link href="/login" className="text-zinc-500 text-sm font-semibold">
        로그인 / 회원가입
      </Link>
    </div>
  );
}