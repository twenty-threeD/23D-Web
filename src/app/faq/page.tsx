"use client";

import { useState } from "react";
import { IoChevronDownOutline } from "react-icons/io5";
import { PAGE_PADDING } from "@/src/lib/layout";
import { FAQ_ITEMS as faqItems } from "@/src/lib/faq";

export default function Page() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="flex flex-1 flex-col bg-white">
      <main className={`flex-1 ${PAGE_PADDING}`}>
        <div className="w-full">
          <header className="border-b border-line pb-8 lg:pb-10">
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
            <div className="overflow-hidden rounded-xl border border-line">
              {faqItems.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={item.question}
                    className="border-b border-line last:border-b-0"
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
                      <div className="flex flex-col gap-3 border-t border-main/10 bg-main/2 px-5 py-5 text-sm leading-7 text-zinc-600 lg:px-6">
                        <p>{item.answer}</p>
                        {item.email && (
                          <a href={`mailto:${item.email}`} className="block font-semibold text-main hover:text-orange-600">
                            {item.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
