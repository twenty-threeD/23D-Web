import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PremiumCard from "@/components/PremiumCard";
import NormalCard from "@/components/NormalCard";

export default function Page() {
  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center px-20 py-16 gap-16">
        {/* 1 */}
        <div className="flex items-center justify-center gap-16 w-full">
          {/* Left tap */}
          <div className="flex flex-col w-300 gap-4 justify-center">
            <div className="flex flex-col">
              <h1 className="text-3xl font-semibold">능력자가 필요한 순간,</h1>
              <h1 className="text-3xl font-semibold whitespace-nowrap">좋은 능력자를 바로바로 잇다에서!</h1>
            </div>
            <div className="w-full px-4 py-2 border border-zinc-300 rounded-lg">
              <input className="text-lg font-semibold focus:outline-none w-full" placeholder="무슨 능력자가 필요한가요?" />
            </div>

            {/* select tap */}
            <div className="flex w-full gap-3">
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-red-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">이사/청소</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-orange-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">설치/수리</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-yellow-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">인테리어</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-lime-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">외주</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-green-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">법률/금융</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-blue-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">과외</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-purple-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">자동차</p>
              </div>
              <div className="flex flex-col items-center justify-center w-0 flex-1">
                <div className="w-full rounded-lg aspect-square bg-pink-500"></div>
                <p className="whitespace-nowrap text-sm mt-2">기타</p>
              </div>
            </div>
          </div>

          {/* Right tap */}
          <div className="w-full h-64 bg-pink-300 border border-zinc-300 rounded-lg"></div>
        </div>

        {/* 광고탭 */}
        <div className="w-full h-full flex flex-col gap-2">
          <div className="flex gap-2 items-baseline">
            <h2 className="text-2xl font-bold">유명한 능력자</h2>
            <small className="text-zinc-400">광고</small>
          </div>
          <div className="flex items-center justify-between gap-8 w-full">
            <PremiumCard title="강남덴트" rating={4.8} reviewCount={123} description="실내디테일링세차 / 광택 / 에바크리닝 / 물때 제거 / 담배냄새 제거등 여러가지 작업을 진행하고 있습니다 최상의 결과물을 보장합니다!!!" />
            <PremiumCard title="서초정비" rating={4.9} reviewCount={200} description="자동차 정비와 점검을 전문으로 하고 있습니다. 빠르고 정확한 서비스로 고객님의 만족을 드리겠습니다." />
            <PremiumCard title="강남청소" rating={4.7} reviewCount={95} description="전문적인 청소 서비스로 집이나 사무실을 깨끗하게 만들어 드립니다." />
          </div>
        </div>

        {/* 탭 1 */}
        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold">이웃들이<br/>많이 찾아요</h2>
          <div className="flex gap-4">
            <NormalCard />
            <NormalCard />
            <NormalCard />
            <NormalCard />
          </div>
        </div>

        {/* 탭 2 */}
        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold">재방문율이<br/>높아요</h2>
          <div className="flex gap-4">
            <NormalCard />
            <NormalCard />
            <NormalCard />
            <NormalCard />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}