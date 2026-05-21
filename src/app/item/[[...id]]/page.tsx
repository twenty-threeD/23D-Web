import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import Banner from "@/src/components/Banner";
import Portfolio from "@/src/components/Portfolio";
import PriceCard from "@/src/components/PriceCard";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      <Header />
      <Banner />
      <div className="flex px-20 gap-16 justify-between items-start py-16">
        {/* left content */}
        <div className="w-3xl flex flex-col gap-6">
          {/* 프로필 */}
          <div className="flex flex-col p-5 border border-zinc-300 rounded-lg gap-8 items-center justify-center">

            <div className="w-full flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-300" />
                <div className="flex flex-col justify-between py-1">
                  <span className="font-bold text-xl">오늘의 에어컨</span>
                  <span className="text-sm text-zinc-400">“전문가”의 꼼꼼한 시공/최고의 퀄리티!/<br/>대표 직접 시공!!24시간문의 환영입니다!</span>
                </div>
              </div>
              <span className="text-sm text-zinc-600">설치/수리 &gt; 에어컨 대구광역시 / 50km 이동가능</span>
            </div>

            <div className="flex w-full py-4 items-center justift-center">
              <div className="w-1/3 flex flex-col gap-2 text-center">
                <span className="text-sm text-zinc-400">총 거래 건수</span>
                <h3 className="text-2xl font-semibold">24건</h3>
              </div>
              <div className="w-1/3 flex flex-col gap-2 text-center border-x border-zinc-300">
                <span className="text-sm text-zinc-400">리뷰</span>
                <h3 className="text-2xl font-semibold">4.9</h3>
              </div>
              <div className="w-1/3 flex flex-col gap-2 text-center">
                <span className="text-sm text-zinc-400">경력</span>
                <h3 className="text-2xl font-semibold">13년</h3>
              </div>
            </div>
          </div>

          {/* 포트폴리오 */}
          <div className="flex justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold">포트폴리오</h2>
              <span className="text-md text-zinc-400">(24)</span>
            </div>
            <button className="text-md text-zinc-400">전체 보기</button>
          </div>
          <div className="w-full flex gap-4">
            <Portfolio />
            <Portfolio />
            <Portfolio />
          </div>
        </div>

        {/* right content */}
        <PriceCard />
      </div>
      <Footer />
    </div>
  );
}