"use client"

import Link from 'next/link';
import { useRef, useState } from 'react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from '@gsap/react';
import LandingHeader from "@/src/components/LandingHeader";
import Footer from "@/src/components/Footer";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Home() {
  const [isLocation, setIsLocation] = useState(1);
  const container1 = useRef(null);
  const container2 = useRef(null);
  const container3 = useRef(null);
  const box1 = useRef(null);
  const box2 = useRef(null);
  const box3 = useRef(null);

  useGSAP(() => {
    gsap.fromTo(".problem-card", {
      y: 100, 
      opacity: 0,
    },{
      y: 0,
      opacity: 1,
      stagger: 0.5,        // 0.2씩 시차를 두고 순서대로
      scrollTrigger: {
        trigger: container2.current,
        start: "top top",
        end: "+=1500",
        pin: true,
        scrub: 1,
      },
    });
  }, { scope: container2 });

  return (
    <div>
      <LandingHeader/>

      <div className="h-[calc(100vh-64px)] px-20 flex relative items-center" ref={container1}>
        <div className="w-full flex justify-between">
          <div className="flex flex-col gap-16">
            <div className="flex flex-col gap-8">
              {/* Main Title */}
              <div className="flex flex-col gap-2 text-5xl font-extrabold">
                <h1>프리랜서 거래,</h1>
                <h1>이제 믿고
                <span className='text-main'> 잇다</span>
                </h1>
              </div>
              {/* Sub Title */}
              <div className="text-lg font-medium text-zinc-500">
                <p>블록체인에 영구 저장되는 계약서로</p>
                <p>안전한 거래를 시작하세요</p>
              </div>
              {/* Buttons */}
              <div className="flex">
                <Link href="/main" className="bg-main text-white font-bold py-3 px-6 text-xl rounded-full hover:bg-black transition-colors">
                  지금 시작하기
                </Link>
              </div>
            </div>
            <div className="w-full h-0.5 bg-zinc-300 rounded-full"></div>
            {/* Info */}
            <div className="flex gap-8">
              <div className="flex flex-col gap-1">
                <h3 className='text-2xl font-bold'>위변조 불가</h3>
                <p className='text-zinc-500'>해시 검증 기반</p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className='text-2xl font-bold'>에스크로</h3>
                <p className='text-zinc-500'>대금 선예치 결제</p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className='text-2xl font-bold'>실시간</h3>
                <p className='text-zinc-500'>채팅·작업 공유</p>
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full">
            <img src="/main.png" alt="Main Image" className=" object-cover rounded-lg shadow-lg"/>
          </div>
        </div>
      </div>

      <div className="h-screen px-20 flex flex-col relative justify-center bg-[#13110F] text-white gap-32" ref={container2}>
        <div className="flex flex-col gap-2 text-5xl font-extrabold">
          <p className='text-main text-base font-medium pb-8'>PROBLEM</p>
          <h1>프리랜서 거래를 막는 것은</h1>
          <h1>실력이 아니라 불신입니다</h1>
        </div>
        <div className="w-full flex justify-between gap-10">
          <div className="p-10 rounded-2xl flex flex-col gap-4 border border-zinc-700 problem-card" ref={box1}>
            <p className='text-main font-semibold'>01</p>
            <h2 className='text-2xl font-bold'>대금 미지급</h2>
            <p className='text-zinc-400'>작업을 마쳐도 대금이 들어오지 않습니다. 받을 방법을 증명할 수단도 마땅치 않습니다.</p>
          </div>
          <div className="p-10 rounded-2xl flex flex-col gap-4 border border-zinc-700 problem-card" ref={box2}>
            <p className='text-main font-semibold'>02</p>
            <h2 className='text-2xl font-bold'>계약서 분쟁</h2>
            <p className='text-zinc-400'>구두 합의와 수정된 문서가 섞이면서, 무엇이 원본인지 아무도 확인할 수 없게 됩니다.</p>
          </div>
          <div className="p-10 rounded-2xl flex flex-col gap-4 border border-zinc-700 problem-card" ref={box3}>
            <p className='text-main font-semibold'>03</p>
            <h2 className='text-2xl font-bold'>검증 안 된 상대</h2>
            <p className='text-zinc-400'>이력도 평판도 확인하기 어려운 상태에서, 매번 처음부터 상대를 믿어야 합니다.</p>
          </div>
        </div>
      </div>

      <div className="h-screen px-20 flex justify-between items-center gap-32" ref={container3}>
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-2 text-5xl font-extrabold">
            <p className='text-main text-base font-medium pb-8'>SOLUTION</p>
            <h1>계약서는 한번 기록되면</h1>
            <h1>누구도 바꿀 수 없습니다</h1>
          </div>

          <div className="overflow-hidden h-80">
            <ul className="w-full flex flex-col gap-4">
              <li className="flex flex-col gap-2 LIST_ITEM">
                <p className="text-main font-semibold">01</p>
                <h2 className="text-2xl font-bold">계약 조건 합의</h2>
                <p className="text-zinc-400">금액, 기간, 산출물을 템플릿으로 정리합니다.</p>
              </li>
              <li className="flex flex-col gap-2 LIST_ITEM">
                <p className="text-main font-semibold">02</p>
                <h2 className="text-2xl font-bold">해시 생성</h2>
                <p className="text-zinc-400">문서가 고유한 지문값으로 변환됩니다.</p>
              </li>
              <li className="flex flex-col gap-2 LIST_ITEM">
                <p className="text-main font-semibold">03</p>
                <h2 className="text-2xl font-bold">블록에 기록</h2>
                <p className="text-zinc-400">해시가 체인에 올라가고 순서가 확정됩니다.</p>
              </li>
              <li className="flex flex-col gap-2 LIST_ITEM">
                <p className="text-main font-semibold">04</p>
                <h2 className="text-2xl font-bold">위변조 불가</h2>
                <p className="text-zinc-400">한 글자만 바뀌어도 검증이 실패합니다. 원본은 언제든 증명됩니다.</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-1/2 h-1/2 shrink-0">
          <img src="/main.png" alt="Image" className="w-full h-full object-cover rounded-lg shadow-lg"/>
        </div>
      </div>

      <Footer/>
    </div>
  );
}
