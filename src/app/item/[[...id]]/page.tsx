import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import Banner from "@/src/components/Banner";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Header />
      <Banner />
      <div className="flex px-20 gap-8 justify-center items-start py-16">
        {/* left content */}
        <div className="flex flex-col grow gap-6">
          {/* 프로필 */}
          <div className="flex p-4 border border-zinc-300 rounded-lg gap-4 items-start justify-between">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-300"></div>
              <div className="flex flex-col justify-between py-2.5">
                <span className="font-bold text-xl">오늘의 에어컨</span>
                <span className="text-sm text-zinc-400">“전문가”의 꼼꼼한 시공/최고의 퀄리티!/<br/>대표 직접 시공!!24시간문의 환영입니다!</span>
              </div>
            </div>
            <span className="text-sm text-zinc-600">설치/수리 &gt; 에어컨 대구광역시 / 50km 이동가능</span>
          </div>
          

        </div>

        {/* right content */}
        <div className="w-96 flex flex-col gap-6 border border-zinc-300 rounded-lg">
          <div className="flex border-b border-zinc-300 text-zinc-400 font-semibold">
            <button className="w-1/3 py-2">에어컨 청소</button>
            <button className="w-1/3 py-2">설치 / 철거</button>
            <button className="w-1/3 py-2">냉매 보충</button>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <h3 className="text-xl font-semibold">150,000원</h3>
            <h4 className="text-lg font-semibold">에어컨 청소 (1회기준)</h4>
            <span className="text-sm text-zinc-400">실외기 실내기 고압세척<br />필터 교체/세척</span>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
