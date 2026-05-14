import Button from "./Button"
import Link from "next/link"

export default function NormalCard() {
  return (
    <Link href="/item" className="flex flex-col w-64 gap-2 p-3 rounded-lg hover:scale-105 hover:shadow-lg transition-transform duration-300">
      {/* 이미지 */}
      <div className="h-48 rounded-lg bg-zinc-300 overflow-hidden">
        <img src="https://picsum.photos/seed/1/300/200" alt="가게 이미지" className="w-full h-full object-cover"/>
      </div>
      {/* 내용 */}
      <h3 className="text-xl font-semibold">민에어컨</h3>
      <div className="flex justify-between items-center text-zinc-500">
        <p>4.9 (123)</p>
        <p className="font-medium">100,000원 ~</p>
      </div>
      <p className="font-medium text-zinc-500">전문가의 에어컨 설치 이전 철거등과 및 케어 서비스, 연락주시면 에어컨 냉난방기 관련 모든 업무 진행합니다.</p>
      <Button text="에어컨 관련 더보기" to="/" />
    </Link>
  )
}