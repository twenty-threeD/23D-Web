import StarRating from "./StarRating"

export default function Review() {
  function maskName(name: string) {
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 사용자 정보 */}
      <div className="h-14 flex gap-2">
        <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-300" />
        <div className="text-zinc-500 gap-0.5 flex flex-col justify-center">
          {/* 사용자 이름 */}
          <span className="text-sm leading-none">{maskName("김경윤")}</span>
          {/* 서비스 명 및 날짜 */}
          <span className="text-sm font-medium leading-none">에어컨 설치 • 1달전</span>
          {/* 별점 */}
          <div className="flex gap-1 items-center">
            <StarRating rating={4.5} size="sm"/>
            <span className="text-sm font-medium leading-none">4.5</span>
          </div>
        </div>
      </div>

      {/* 리뷰 내용 */}
      <div className="">
        <h4 className="font-medium text-zinc-600">급하게 의뢰했지만 최대한 반영해줘서 빠르게 받아볼 수 있었습니다.</h4>
        <span className="text-sm text-zinc-500">작업일: 9일 • 주문금액: 20만원 ~ 30만원</span>
      </div>
    </div>
  )
}