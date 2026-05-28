import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import PostItem from "@/src/components/PostItem";

export default function Page() {
  return (
    <div>
      <Header />
      <div className="flex items-center justify-between px-20 py-16 gap-16">
        {/* 메뉴바 */}
        <div className="flex flex-1 flex-col gap-6 min-w-0 pr-4 border-r border-zinc-300">
          <h1 className="text-2xl font-bold border-b-2">커뮤니티</h1>
          <div className="flex flex-col">
            <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-200">전체</button>
            <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-200">이거 궁금해요</button>
            <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-200">전문가 추천</button>
            <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-200">견적 궁금해요</button>
            <button className="px-4 py-2 rounded-lg text-left text-zinc-500 font-semibold hover:bg-zinc-200">동네 주민</button>
          </div>
        </div>

        {/* 게시물 리스트 */}
        <main className="flex flex-col gap-4">
          <PostItem/>
        </main>
      </div>
      <Footer />
    </div>
  );
}