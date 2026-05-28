export default function PostItem() {
  return (
    <div className="flex justify-between items=center">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-zinc-500 font-semibold">전체 • 설치/수리 &gt; 에어컨</span>
          <h2>2in1 에어컨 중 벽걸이만 이전 설치</h2>
          <p className="text-zinc-500 line-clamp-2">현재 집에 2in1 에어컨 중에 스탠드는 거실에 벽걸이는 안방에 설치 되어 있습니다.<br/>새 에어컨을 구매 및 설치 한지는 약2년정도 되어서 완전 새것 입니다. 벽걸이 에어컨은 아예 사용하지</p>
        </div>

        <div className="w-32 h-32 rounded-lg">
          <img className="w-full h-full object-cover rounded-lg" src="https://picsum.photos/400/400" alt=""/>
        </div>
      </div>
      <div className=""></div>
    </div>
  );
}