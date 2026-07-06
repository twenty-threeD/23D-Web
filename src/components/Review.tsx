import StarRating from "./StarRating"
import Image from "next/image"

export default function Review() {
  function maskName(name: string) {
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  }

  return (
    <div className="flex gap-2 py-2">
      <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-300 shrink-0" >
        <Image src="/profile.png" alt="프로필사진" className="object-cover" width={48} height={48} />
      </div>
      <div className="flex flex-col">
        <h3 className="text-md font-bold">{maskName("김경윤")}</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 items-center">
            <p className="text-sm font-medium text-zinc-500">에어컨 설치</p>
            <StarRating rating={4.5} size="sm" />
            <span className="text-sm font-medium">4.5</span>
          </div>
        </div>

        <p className="text-sm text-zinc-600 font-medium">급하게 의뢰했지만 최대한 반영해줘서 빠르게 받아볼 수 있었습니다.</p>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-zinc-400">1달전 | 작업일: 9일</span>
          <span className="text-sm font-medium text-zinc-400">주문금액: 20만원 ~ 30만원</span>
        </div>
      </div>
    </div>
  )
}