"use client";

import { useState } from "react";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import Banner from "@/src/components/Banner";
import Portfolio from "@/src/components/Portfolio";
import PriceCard from "@/src/components/PriceCard";
import DoButton from "@/src/components/DoButton";
import Review from "@/src/components/Review";
import StarRating from "@/src/components/StarRating";
import NormalCard from "@/src/components/NormalCard";
import { IoIosArrowUp } from "react-icons/io";
import { FaStar } from "react-icons/fa";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const reviewCount = 24;
  const review = 4.5;
  const [isExpanded, setIsExpanded] = useState(false);

  function handleShowMore() {
    setIsExpanded(!isExpanded);
  }
  
  return (
    <div>
      <Header />
      <Banner />
      <div className="flex flex-col px-20  py-16 gap-16">
        <div className="flex gap-16 justify-between items-start">
          {/* left content */}
          <div className="flex flex-1 flex-col gap-6 min-w-0">
            {/* 프로필 */}
            <div className="flex flex-col p-5 border border-zinc-300 rounded-lg gap-8 items-center justify-center">

              <div className="w-full flex items-start justify-between min-w-0">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-300" />
                  <div className="flex flex-col justify-between py-1">
                    <span className="font-bold text-xl">오늘의 에어컨</span>
                    <span className="text-sm text-zinc-400">“전문가”의 꼼꼼한 시공/최고의 퀄리티!/<br/>대표 직접 시공!!24시간문의 환영입니다!</span>
                  </div>
                </div>
                <span className="text-sm text-zinc-600">설치/수리 &gt; 에어컨 대구광역시 / 50km 이동가능</span>
              </div>

              <div className="flex w-full py-4 items-center justify-between">
                <div className="w-1/3 flex flex-col gap-2 text-center">
                  <span className="text-sm text-zinc-400">총 거래 건수</span>
                  <h3 className="text-2xl font-semibold">24건</h3>
                </div>
                <div className="w-1/3 flex flex-col gap-2 text-center border-x border-zinc-300">
                  <span className="text-sm text-zinc-400">리뷰</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <FaStar className="text-main size-5"/>
                    <h3 className="text-2xl font-semibold">{review}</h3>
                    <span className="text-sm text-zinc-500">({reviewCount})</span>
                  </div>
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
              <Portfolio />
            </div>

            {/* 상세 설명 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">서비스 설명</h2>
              <p
                className={`$${""}
                  ${isExpanded
                    ? "text-zinc-500"
                    : "line-clamp-10 bg-linear-to-b from-zinc-500 via-zinc-300 to-white bg-clip-text text-transparent"
                }`}
              >
                ◆ 안녕하세요 깔끔e 입니다! 저희는 20대 후반부터 30대 청년들로 구성 되어 있는 청소대행 전문업체 입니다.<br/>◆ 저희업체는 청소전문교육 및 검증이 완료된 인원만으로 청소 진행을 합니다!<br/>◆ 저희업체는 스팀청소, 검증된 친환경 약품 및 전문장비들을 이용하여 청소 진행을 합니다!<br/>◆ 저희업체는 고객님들의 최대한의 만족을 위해 시간이 걸리더라도 구애받지 않고 보다 꼼꼼하게 작업 해 드릴 것을 약속 드립니다!<br/>◆ 저희업체는 항상 청소작업 마무리 전 사전연락 드린 후, 고객님들께 검수를 받고 있습니다!<br/><br/>● 전체적인 작업은 이렇게 진행됩니다<br/>● 1. 주방<br/>✔ 싱크대 상, 하부 청소 (수납장 탈거 후 청소)<br/>✔ 가스레인지, 인덕션 등 기름때 청소 (오염도에 따라 스팀청소 및 전용세제 사용)<br/>✔ 후드 및 필터 기름때 청소 (오염도에 따라 스팀청소 및 전용세제 사용)<br/>✔ 주방 타일 기름때 청소 (오염도에 따라 스팀청소 및 전용세제사용)<br/>✔ 싱크대 걸레받이 분리 및 청소 2. 화장실<br/>✔ 벽, 천장, 타일 청소<br/>✔ 세면대, 변기 찌든때 제거<br/>✔ 거울 , 샤워부스 물때 제거<br/>✔ 환풍기 내/외부, 수납장 청소<br/>✔ 배수구, 바닥 청소
              </p>
              <DoButton onClick={handleShowMore}>
                {isExpanded ? "접기" : "더보기"}
              </DoButton>
            </div>

            {/* 리뷰 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">리뷰 {reviewCount}개</h2>
              <div className="flex gap-2 w-full px-4 py-10 border border-zinc-300 rounded-lg items-center">
                <StarRating rating={review} />
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-semibold">{review}</p>
                  <span className="text-sm text-zinc-500">({reviewCount})</span>
                </div>
              </div>
              
              {/* 리뷰 목록 */}
              <div className="flex flex-col gap-4">
                <Review />
                <Review />
                <Review />
              </div>
            </div>
          </div>

          {/* right content */}
          <div className="flex flex-col gap-4">
            <div className="w-100 shrink-0">
              <PriceCard />
            </div>
            <div className="bg-zinc-100 p-4 rounded-lg">
              <ul className="flex flex-col gap-1 list-disc list-inside">
                <li className="text-zinc-400 text-xs font-semibold">서비스 이후 금액이 전달 되니 안전하게 거래하세요.</li>
                <li className="text-zinc-400 text-xs font-semibold">견적서와 계약서는 블록체인을 통해 평생 안전히 보관됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      
        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold">이웃들이<br/>많이 찾아요</h2>
          <div className="flex gap-4">
            <NormalCard />
            <NormalCard />
            <NormalCard />
            <NormalCard />
          </div>
        </div>

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
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-20 flex items-center justify-center rounded-full bg-main p-3 text-white shadow-lg hover:bg-orange-600"
        aria-label="맨위로 이동"
      >
        <IoIosArrowUp className="text-2xl" />
      </button>
      <Footer />
    </div>
  );
}