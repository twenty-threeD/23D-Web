"use client";

import { useState } from "react";
import { IoChevronDownOutline } from "react-icons/io5";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

const faqItems = [
  {
    question: "잇다는 어떤 서비스인가요?",
    answer:
      "잇다는 자신의 경험과 능력을 서비스로 등록하고, 필요한 능력자를 찾아 연결될 수 있는 플랫폼입니다. 서비스 탐색부터 문의, 채팅, 거래까지 한 곳에서 이용할 수 있습니다.",
  },
  {
    question: "서비스를 이용하려면 회원가입이 필요한가요?",
    answer:
      "서비스를 둘러보는 것은 회원가입 없이도 가능합니다. 다만 채팅, 서비스 등록, 결제 등 일부 기능은 회원가입과 로그인이 필요합니다.",
  },
  {
    question: "서비스를 등록하려면 어떻게 해야 하나요?",
    answer:
      "로그인 후 상단 메뉴의 ‘서비스 등록’을 선택해 서비스 제목, 설명, 가격과 관련 이미지를 입력하면 됩니다. 등록한 서비스는 검토 후 다른 이용자에게 공개됩니다.",
  },
  {
    question: "등록된 능력자에게 어떻게 문의하나요?",
    answer:
      "관심 있는 서비스 상세 페이지에서 문의를 시작할 수 있습니다. 채팅을 통해 작업 범위, 일정, 비용 등을 충분히 협의한 뒤 거래를 진행해 주세요.",
  },
  {
    question: "결제와 환불은 어떻게 진행되나요?",
    answer:
      "결제는 서비스 상세 내용과 결제 화면에 안내된 절차에 따라 진행됩니다. 환불이 필요한 경우 거래 상대방과 먼저 내용을 확인한 뒤 결제 관련 문의처로 접수해 주세요.",
  },
  {
    question: "계정이나 개인정보를 수정하고 싶어요.",
    answer:
      "로그인 후 프로필 메뉴에서 수정할 수 있습니다. 개인정보처리방침에 따라 개인정보 관련 열람·수정·삭제 요청은 문의 이메일로 접수할 수 있습니다.",
  },
  {
    question: "서비스 이용 중 문제가 생기면 어디로 문의하나요?",
    answer: (
      <>
        이용 중 불편한 점이나 제휴 문의는 아래 이메일로 보내주세요. 문의 내용을
        자세히 남겨주시면 확인 후 답변드리겠습니다.
        <a
          href="mailto:itda23d@gmail.com"
          className="mt-3 block font-semibold text-main hover:text-orange-600"
        >
          itda23d@gmail.com
        </a>
      </>
    ),
  },
];

export default function Page() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header />
      <main className="flex-1 px-5 py-10 lg:px-20 lg:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <header className="border-b border-zinc-200 py-8 lg:py-10">
            <p className="pb-3 text-sm font-bold tracking-wide text-main">
              ITDA HELP
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 lg:text-4xl">
              자주 묻는 질문
            </h1>
            <p className="pt-4 max-w-2xl text-sm leading-6 text-zinc-500 lg:text-base">
              잇다 서비스를 이용하면서 자주 궁금해하는 내용을 모았습니다.
            </p>
          </header>

          <section aria-label="자주 묻는 질문 목록" className="py-10 lg:py-14">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              {faqItems.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={item.question}
                    className="border-b border-zinc-200 last:border-b-0"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors lg:px-6 ${
                        isOpen ? "bg-main/5" : "hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold lg:text-base ${isOpen ? "text-main" : "text-zinc-800"}`}
                      >
                        <span className="mr-3 text-xs font-bold text-zinc-400">
                          Q{String(index + 1).padStart(2, "0")}
                        </span>
                        {item.question}
                      </span>
                      <IoChevronDownOutline
                        aria-hidden="true"
                        className={`shrink-0 text-lg text-zinc-400 transition-transform ${isOpen ? "rotate-180 text-main" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-main/10 bg-main/2 px-5 py-5 text-sm leading-7 text-zinc-600 lg:px-6">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
