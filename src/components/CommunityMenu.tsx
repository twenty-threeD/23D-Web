export default function CommunityMenu() {
  return (
    <div className="flex flex-col min-h-screen w-48 shrink-0 gap-6 pr-4">
      <h1 className="text-xl pb-1 font-semibold border-b-2">커뮤니티</h1>
      <div className="flex flex-col">
        <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-100">전체</button>
        <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-100">이거 궁금해요</button>
        <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-100">전문가 추천</button>
        <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-100">견적 궁금해요</button>
        <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-100">동네 주민</button>
      </div>
    </div>
  )
}