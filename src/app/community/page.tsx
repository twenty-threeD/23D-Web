"use client";

import { useState, useEffect } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { IoIosArrowUp } from "react-icons/io";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import CommunityMenu from "@/src/components/CommunitySideBar";
import PostItem from "@/src/components/PostItem";
import Search from "@/src/components/Search";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTop, setIsTop] = useState(true);
  const [selected, setSelected] = useState("필터");
  
  const options = ["전체", "이거 궁금해요", "전문가 추천", "견적 궁금해요", "동네 주민"];

  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.scrollY === 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <Header />
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        {/* 메뉴바 */}
        <CommunityMenu />

        {/* 게시물 리스트 */}
        <main className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2">
            {/* 검색창 */}
            <Search where="post" />
            
            {/* 드롭다운 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg whitespace-nowrap cursor-pointer hover:bg-zinc-100"
              >
                <p className="text-lg">{selected}</p>
                <IoIosArrowDown className="text-lg" />
              </button>

              {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-zinc-300 rounded-lg shadow-lg z-10">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelected(option);
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-zinc-700 hover:bg-zinc-100 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 글작성 버튼 */}
            <button className="text-lg px-4 py-2 border text-center bg-main border-zinc-300 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer hover:bg-orange-600">
              글작성
            </button>
          </div>
          <div className="flex flex-col divide-y divide-zinc-300">
            <PostItem/>
            <PostItem/>
            <PostItem/>
            <PostItem/>
          </div>
        </main>
      </div>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={isTop ? "hidden" : "fixed bottom-6 right-6 z-20 flex items-center justify-center rounded-full bg-main p-3 text-white shadow-lg hover:bg-orange-600"}
        aria-label="맨위로 이동"
      >
        <IoIosArrowUp className="text-2xl" />
      </button>
      <Footer />
    </div>
  );
}