import Link from "next/link";

export default function PriceCard() {
  return (
    <div className="grow flex flex-col gap-2 border border-zinc-300 rounded-lg sticky top-24 self-start">
      {/* Header */}
      <div className="flex border-b border-zinc-300 text-zinc-400 font-semibold">
        <button className="w-1/3 py-2">에어컨 청소</button>
        <button className="w-1/3 py-2">설치 / 철거</button>
        <button className="w-1/3 py-2">냉매 보충</button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 py-4 px-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">150,000원</h3>
          <h4 className="text-lg font-semibold">에어컨 청소 (1회기준)</h4>
          <span className="text-sm text-zinc-400">
            실외기 실내기 고압세척
            <br />
            필터 교체/세척
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex justify-between w-full">
            <span className="text-sm text-zinc-400">실외기 청소</span>
            <span className="text-sm text-zinc-400">O</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-sm text-zinc-400">필터 교체/세척</span>
            <span className="text-sm text-zinc-400">O</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-sm text-zinc-400">에어컨 가스 충전</span>
            <span className="text-sm text-zinc-400">O</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-sm text-zinc-400">에어컨 설치</span>
            <span className="text-sm text-zinc-400">X</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-sm text-zinc-400">에어컨 철거</span>
            <span className="text-sm text-zinc-400">X</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* 견적서 버튼 */}
          <Link
            href="/"
            className="w-full py-2 border text-center border-zinc-300 font-semibold rounded-md"
          >
            견적서 요청
          </Link>
          {/* 문의하기 버튼 */}
          <Link
            href="/"
            className="w-full py-2 border text-center bg-main border-zinc-300 text-white font-semibold rounded-md"
          >
            문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
