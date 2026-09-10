"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

const sections = [
  { id: "purpose", label: "제1조 개인정보처리방침의 목적" },
  { id: "items", label: "제2조 수집하는 개인정보" },
  { id: "use", label: "제3조 개인정보의 이용 목적" },
  { id: "thirdParty", label: "제4조 개인정보의 제3자 제공" },
  { id: "retention", label: "제5조 보유 및 이용 기간" },
  { id: "blockchain", label: "제6조 거래기록 및 블록체인" },
  { id: "rights", label: "제7조 이용자의 권리" },
  { id: "contact", label: "제8조 문의처" },
];

export default function Page() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];

        if (visibleSection) {
          setActiveSection(visibleSection.target.id);
        }
      },
      { rootMargin: "-18% 0px -68% 0px" },
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header />

      <main className="flex-1 px-5 py-10 lg:px-20 lg:py-16">
        <div className="mx-auto w-full max-w-6xl">
          <header className="border-b border-zinc-200 py-8 lg:py-10">
            <p className="pb-3 text-sm font-bold tracking-wide text-main">
              ITDA POLICY
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 lg:text-4xl">
              개인정보처리방침
            </h1>

            <p className="max-w-2xl pt-4 text-sm leading-6 text-zinc-500 lg:text-base">
              잇다는 이용자의 개인정보를 중요하게 생각하며,
              서비스 제공에 필요한 범위에서 안전하게 이용합니다.
            </p>

            <p className="pt-5 text-xs text-zinc-400">
              시행일: 2026년 9월 10일
            </p>
          </header>

          <div className="grid gap-10 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-14">
            <nav
              aria-label="개인정보처리방침 목차"
              className="h-fit lg:sticky lg:top-24"
            >
              <p className="pb-4 text-xs font-bold tracking-wide text-zinc-400">
                CONTENTS
              </p>

              <ul className="flex flex-col gap-3 border-l border-zinc-200 pl-4">
                {sections.map((section) => (
                  <li key={section.id}>
                    <Link
                      href={`#${section.id}`}
                      aria-current={
                        activeSection === section.id
                          ? "location"
                          : undefined
                      }
                      className={`-ml-3 block rounded-md px-3 py-1.5 text-sm leading-5 transition-colors ${
                        activeSection === section.id
                          ? "bg-main/10 font-semibold text-main"
                          : "text-zinc-500 hover:text-main"
                      }`}
                    >
                      {section.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <article className="max-w-3xl text-sm leading-7 text-zinc-600">
              {/* 제1조 */}
              <section
                id="purpose"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5"
              >
                <h2 className="text-lg font-bold text-main">
                  제1조 개인정보처리방침의 목적
                </h2>

                <p className="pt-3">
                  잇다(이하 &quot;서비스&quot;)는 사람과 사람을 연결하여
                  필요한 용역을 찾고 거래할 수 있도록 지원하는 중개
                  플랫폼입니다.
                </p>

                <p className="pt-3">
                  서비스는 이용자의 개인정보를 서비스 제공에 필요한
                  범위에서 수집·이용하며, 개인정보의 처리와 관련된
                  내용을 본 개인정보처리방침을 통해 안내합니다.
                </p>
              </section>

              {/* 제2조 */}
              <section
                id="items"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제2조 수집하는 개인정보
                </h2>

                <p className="pt-3">
                  서비스는 회원가입 및 서비스 이용을 위해 다음과 같은
                  정보를 수집할 수 있습니다.
                </p>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회원가입 정보: 이메일 주소, 비밀번호, 닉네임
                  </p>

                  <p>
                    ② 프로필 정보: 프로필 이미지, 자기소개, 기술,
                    경력 등 이용자가 직접 등록한 정보
                  </p>

                  <p>
                    ③ 거래 정보: 거래 상대방, 거래 내용, 거래 상태,
                    거래 일시 등
                  </p>

                  <p>
                    ④ 서비스 이용 정보: 채팅 내용, 문의 내용,
                    접속 및 서비스 이용 기록
                  </p>

                  <p>
                    ⑤ 위치기반 기능을 이용하는 경우:
                    이용자가 제공하거나 허용한 위치 또는 지역 정보
                  </p>
                </div>

                <p className="pt-4 text-zinc-400">
                  결제 기능이 제공되는 경우 카드번호 등 결제수단의
                  주요 정보는 결제 서비스를 제공하는 업체에서 처리하며,
                  잇다가 직접 저장하지 않을 수 있습니다.
                </p>
              </section>

              {/* 제3조 */}
              <section
                id="use"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제3조 개인정보의 이용 목적
                </h2>

                <p className="pt-3">
                  수집한 개인정보는 다음과 같은 목적으로 이용합니다.
                </p>

                <div className="space-y-3 pt-3">
                  <p>① 회원 식별 및 계정 관리</p>

                  <p>
                    ② 의뢰인과 능력자 간의 검색, 매칭 및 거래 연결
                  </p>

                  <p>③ 회원 간 채팅 및 거래 진행</p>

                  <p>④ 결제, 취소, 환불 등 거래 관련 기능 제공</p>

                  <p>⑤ 서비스 관련 안내 및 문의 처리</p>

                  <p>⑥ 부정 이용 방지 및 서비스 안정성 확보</p>

                  <p>⑦ 서비스 이용환경 및 기능 개선</p>
                </div>
              </section>

              {/* 제4조 */}
              <section
                id="thirdParty"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제4조 개인정보의 제3자 제공
                </h2>

                <p className="pt-3">
                  잇다는 사람과 사람을 연결하는 중개 서비스를 제공하기
                  때문에 매칭 또는 거래 과정에서 필요한 개인정보가
                  거래 상대방에게 제공될 수 있습니다.
                </p>

                <div className="mt-5 rounded-xl bg-zinc-50 p-5">
                  <p>
                    <span className="font-semibold text-zinc-800">
                      제공받는 자
                    </span>
                    : 거래 상대방(의뢰인 또는 능력자)
                  </p>

                  <p className="pt-2">
                    <span className="font-semibold text-zinc-800">
                      제공 목적
                    </span>
                    : 회원 간 연결, 용역 협의 및 거래 진행
                  </p>

                  <p className="pt-2">
                    <span className="font-semibold text-zinc-800">
                      제공 정보
                    </span>
                    : 닉네임, 프로필 정보 및 거래 진행에 필요한 정보
                  </p>

                  <p className="pt-2">
                    <span className="font-semibold text-zinc-800">
                      보유 기간
                    </span>
                    : 거래 및 서비스 이용 목적이 달성될 때까지
                  </p>
                </div>

                <p className="pt-4">
                  서비스는 거래에 필요한 범위를 넘어 개인정보를
                  제공하지 않으며, 이용자가 직접 공개한 프로필 정보는
                  서비스 내 다른 이용자에게 표시될 수 있습니다.
                </p>

                <p className="pt-3">
                  법령에 따라 요구되는 경우를 제외하고 개인정보를
                  다른 목적으로 임의 제공하지 않습니다.
                </p>
              </section>

              {/* 제5조 */}
              <section
                id="retention"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제5조 개인정보의 보유 및 이용 기간
                </h2>

                <p className="pt-3">
                  개인정보는 회원이 서비스를 이용하는 동안 보유하며,
                  회원 탈퇴 또는 개인정보의 이용 목적이 달성된 경우
                  지체 없이 삭제하는 것을 원칙으로 합니다.
                </p>

                <p className="pt-3">
                  다만 거래 내역, 분쟁 처리 기록 등 일정 기간 보관할
                  필요가 있는 정보는 관련 법령 또는 서비스 운영상
                  필요한 범위에서 일정 기간 보관될 수 있습니다.
                </p>
              </section>

              {/* 제6조 */}
              <section
                id="blockchain"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제6조 거래기록 및 블록체인
                </h2>

                <p className="pt-3">
                  잇다는 거래기록의 신뢰성과 무결성을 확인하기 위해
                  블록체인 기술을 활용할 수 있습니다.
                </p>

                <p className="pt-3">
                  블록체인에는 거래를 확인하기 위한 거래 식별값,
                  해시값, 기록 시각 등의 정보가 기록될 수 있습니다.
                </p>

                <p className="pt-3">
                  이메일 주소, 비밀번호, 연락처 등 이용자를 직접
                  식별할 수 있는 개인정보 자체를 블록체인에 기록하는
                  것을 목적으로 하지 않습니다.
                </p>

                <p className="pt-3 text-zinc-400">
                  블록체인의 특성상 한 번 기록된 정보는 변경 또는
                  삭제가 어려울 수 있습니다.
                </p>
              </section>

              {/* 제7조 */}
              <section
                id="rights"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제7조 이용자의 권리
                </h2>

                <p className="pt-3">
                  이용자는 서비스 내에서 자신의 개인정보를 확인하거나
                  수정할 수 있습니다.
                </p>

                <p className="pt-3">
                  또한 회원 탈퇴를 통해 개인정보의 삭제를 요청할 수
                  있으며, 개인정보와 관련된 문의 또는 요청이 있는 경우
                  아래 문의처를 이용할 수 있습니다.
                </p>

                <p className="pt-3">
                  선택적으로 제공하는 개인정보 또는 위치정보의 이용에
                  동의하지 않을 수 있으며, 해당 정보가 필요한 일부
                  기능의 이용은 제한될 수 있습니다.
                </p>
              </section>

              {/* 제8조 */}
              <section
                id="contact"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제8조 문의처
                </h2>

                <p className="pt-3">
                  개인정보 보호 및 처리와 관련한 문의는 아래 이메일로
                  보내주시기 바랍니다.
                </p>

                <a
                  href="mailto:itda23d@gmail.com"
                  className="inline-block pt-3 font-semibold text-main hover:text-orange-600"
                >
                  itda23d@gmail.com
                </a>
              </section>

              <div className="mt-12 border-t border-zinc-200 pt-8">
                <p className="font-semibold text-zinc-700">
                  부칙
                </p>

                <p className="pt-2 text-xs leading-5 text-zinc-400">
                  본 개인정보처리방침은 2026년 9월 10일부터 시행합니다.
                  서비스 운영 또는 기능 변경에 따라 내용이 변경될 수 있으며,
                  변경사항은 본 페이지를 통해 안내합니다.
                </p>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}