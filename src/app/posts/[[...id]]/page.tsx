"use client"

import Header from "@/src/components/Header"
import Footer from "@/src/components/Footer"
import CommunityMenu from "@/src/components/CommunitySideBar";
import Comment from "@/src/components/Comment";
import { IoIosArrowUp, IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { IoChatboxOutline } from "react-icons/io5";
import MDEditor from '@uiw/react-md-editor'
import Image from "next/image";
import PostItem from "@/src/components/PostItem";

export default function Page() {
  const content = `
# R5 번들과 짭짭트로 가볍게 시작했던 심레이싱.  

**입문하고부터 시뮬 세계에 진심 모드가 되어 현재진행형으로 꾸준히 업데이트 중이지만,**  

이제 KS pro, 엠부스트 외에는 크게 관심 있는 품목이 없어 당분간 현행으로 유지될 것 같아 제 장비를 소개해 드립니다.  

여기까지 대략 업그레이드와 중복 투자를 하며 현재 장비 소개를 해드렸는데, 중간중간 누락된 부분도 많은 것 같고 생각나는 대로 정리해서 적어 보았습니다.

처음 시작할 때만 해도 이렇게까지 될 줄은 몰랐는데 나름 저렴하게? 가성비적인 시점으로 구성해서 만족도가 상당히 높은 것 같습니다.

다음 업그레이드가 어떤 것이 될지 아직 모르지만, 현재에 만족하며 열심히 즐기고 있습니다.

긴 글 읽어주셔서 감사합니다.

모두들 즐거운 심레이싱 되세요!
  `.trim();

  return (
    <div>
      <Header />
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        {/* 메뉴바 */}
        <CommunityMenu/>

        {/* 게시물 리스트 */}
        <main className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-4 w-full border-zinc-200 border rounded-lg p-8">
            {/* 헤더 */}
            <header className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-main">이거 궁금해요 &gt;</span>
                <h1 className="text-2xl font-medium">입문 7개월차 나름? 가성비 뉴비의 심리그 소개</h1>
              </div>
              {/* 프로필 */}
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-zinc-300 shrink-0">
                  <Image src="/profile.png" alt="프로필사진" className="object-cover" width={48} height={48} />
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h3 className="text-sm font-medium">권민기</h3>
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <span className="text-sm font-medium text-zinc-400">2026.06.04. 17:25</span>
                      <span className="text-sm font-medium text-zinc-400">조회 1,521</span>
                    </div >
                    <div className="flex items-center gap-1">
                      <IoChatboxOutline className="text-xl" />
                      <span className="text-zinc-500 text-sm font-semibold">댓글</span>
                      <p className="text-sm font-semibold">20</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <hr className="text-zinc-300" />

            {/* 게시물 내용 */}
            <style>{`
              .wmde-markdown h1 {
                border-bottom: none !important;
              }
              .wmde-markdown h1 .anchor {
                display: none !important;
              }
            `}</style>
            <div data-color-mode="light" className="flex flex-col gap-8 py-2">
              <MDEditor.Markdown source={content} />
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <IoMdHeartEmpty className="text-2xl text-main" />
                  <span className="text-zinc-500 text-sm font-semibold">좋아요</span>
                  <p className="text-sm font-semibold">20</p>
                </div>
                <div className="flex items-center gap-1">
                  <IoChatboxOutline className="text-xl" />
                  <span className="text-zinc-500 text-sm font-semibold">댓글</span>
                  <p className="text-sm font-semibold">20</p>
                </div>
              </div>
            </div>

            <hr className="text-zinc-300" />

            {/* 댓글 */}
            <div className="flex flex-col gap-2 divide-zinc-200 divide-y">
              <Comment />
              <Comment />
              <Comment />
              <Comment />
              {/* 댓글 달기 */}
              <div className="flex items-start gap-4 pt-4">
                <div className="flex flex-col gap-2 w-full p-6 border border-zinc-300 rounded-lg">
                  <h3 className="text-md font-bold">권민기</h3>
                  <textarea
                    placeholder="댓글을 입력하세요..."
                    className="w-full h-24 focus:outline-none resize-none"
                  />
                  <button className="self-end px-4 py-2 bg-main text-white font-semibold rounded-lg hover:bg-orange-600">
                    등록
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 관련 게시물 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">관련 게시물</h2>
            <div className="flex flex-col divide-y divide-zinc-300">
              <PostItem/>
              <PostItem/>
              <PostItem/>
              <PostItem/>
            </div>
          </div>
        </main>
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
  )
}