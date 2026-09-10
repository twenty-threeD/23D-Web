"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

const sections = [
  { id: "purpose", label: "제1조 목적" },
  { id: "definition", label: "제2조 용어의 정의" },
  { id: "terms", label: "제3조 약관의 효력 및 변경" },
  { id: "membership", label: "제4조 회원가입 및 계정" },
  { id: "service", label: "제5조 서비스의 내용 및 회사의 역할" },
  { id: "transaction", label: "제6조 용역 등록 및 거래" },
  { id: "payment", label: "제7조 결제·정산·취소 및 환불" },
  { id: "blockchain", label: "제8조 블록체인 기반 거래기록" },
  { id: "responsibility", label: "제9조 회원의 의무 및 금지행위" },
  { id: "privacy", label: "제10조 개인정보 보호" },
  { id: "content", label: "제11조 게시물 및 지식재산권" },
  { id: "restriction", label: "제12조 이용 제한 및 계약 해지" },
  { id: "liability", label: "제13조 책임 및 책임의 제한" },
  { id: "dispute", label: "제14조 분쟁 해결" },
  { id: "contact", label: "제15조 회사 정보 및 문의" },
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
      if (element) observer.observe(element);
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
              이용약관
            </h1>

            <p className="max-w-2xl pt-4 text-sm leading-6 text-zinc-500 lg:text-base">
              잇다 서비스 이용에 필요한 기본적인 권리와 의무,
              용역 중개 및 거래에 관한 사항을 안내합니다.
            </p>

            <p className="pt-5 text-xs text-zinc-400">
              시행일: 2026년 9월 10일
            </p>
          </header>

          <div className="grid gap-10 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-14">
            <nav
              aria-label="이용약관 목차"
              className="h-fit lg:sticky lg:top-24"
            >
              <p className="pb-4 text-xs font-bold tracking-wide text-zinc-400">
                CONTENTS
              </p>

              <ul className="flex flex-col gap-2 border-l border-zinc-200 pl-4">
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
                  제1조 목적
                </h2>

                <p className="pt-3">
                  본 약관은 잇다 서비스 운영자(이하 &quot;회사&quot;)가
                  제공하는 블록체인 기반 용역 중개 플랫폼
                  &quot;잇다&quot;(이하 &quot;서비스&quot;)의 이용과
                  관련하여 회사와 회원 사이의 권리, 의무 및 책임사항,
                  서비스 이용조건과 절차 등 필요한 사항을 정하는 것을
                  목적으로 합니다.
                </p>
              </section>

              {/* 제2조 */}
              <section
                id="definition"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제2조 용어의 정의
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① &quot;회원&quot;이란 본 약관에 동의하고 회사가 정한
                    절차에 따라 서비스에 가입하여 서비스를 이용하는 자를
                    말합니다.
                  </p>

                  <p>
                    ② &quot;의뢰인&quot;이란 서비스를 통하여 용역을 검색하고,
                    용역 제공을 요청하거나 구매하는 회원을 말합니다.
                  </p>

                  <p>
                    ③ &quot;제공자&quot;란 서비스 내에서
                    &quot;능력자&quot; 등의 명칭으로 표시되며, 자신의 기술,
                    경험 또는 전문성을 이용한 용역을 등록하거나 제공하는
                    회원을 말합니다.
                  </p>

                  <p>
                    ④ &quot;용역&quot;이란 제공자가 서비스를 통하여
                    의뢰인에게 제공하는 업무, 작업, 상담, 제작 또는 그 밖의
                    서비스를 말합니다.
                  </p>

                  <p>
                    ⑤ &quot;거래&quot;란 의뢰인과 제공자 사이에 용역의 내용,
                    기간, 대금 및 기타 조건에 관하여 합의하여 성립하는
                    계약관계를 말합니다.
                  </p>

                  <p>
                    ⑥ &quot;거래정보&quot;란 거래의 체결, 진행, 완료,
                    취소 등의 사실을 확인하기 위하여 서비스에서 생성되는
                    계약번호, 거래상태, 시각정보, 해시값 또는 그 밖의
                    전자적 기록을 말합니다.
                  </p>

                  <p>
                    ⑦ 본 조에서 정하지 않은 용어는 관계 법령, 서비스 화면의
                    안내 및 일반적인 거래 관행에 따릅니다.
                  </p>
                </div>
              </section>

              {/* 제3조 */}
              <section
                id="terms"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제3조 약관의 효력 및 변경
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 본 약관은 서비스 화면에 게시하거나 기타 적절한
                    방법으로 회원에게 알림으로써 효력이 발생합니다.
                  </p>

                  <p>
                    ② 회사는 관계 법령을 위반하지 않는 범위에서 본 약관을
                    변경할 수 있습니다.
                  </p>

                  <p>
                    ③ 회사가 약관을 변경하는 경우 적용일자, 변경내용 및
                    변경사유를 서비스 내 공지사항 등 회원이 확인할 수 있는
                    방법으로 사전에 안내합니다. 회원에게 중대한 영향을
                    미치는 변경의 경우에는 필요한 범위에서 별도의 방법으로
                    안내할 수 있습니다.
                  </p>

                  <p>
                    ④ 변경된 약관의 내용이 회원에게 불리하거나 회원의
                    중요한 권리·의무에 영향을 미치는 경우 회사는 관계 법령에
                    따라 필요한 동의 또는 고지 절차를 진행합니다.
                  </p>
                </div>
              </section>

              {/* 제4조 */}
              <section
                id="membership"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제4조 회원가입 및 계정
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회원가입은 이용자가 본 약관 및 가입 과정에서 요구되는
                    필수사항에 동의하고 회사가 요구하는 정보를 입력한 후,
                    회사가 가입을 승인함으로써 완료됩니다.
                  </p>

                  <p>
                    ② 회원은 가입 시 사실에 부합하는 정보를 제공하여야 하며,
                    등록된 정보가 변경된 경우 서비스에서 제공하는 방법을
                    통하여 이를 최신 상태로 유지하여야 합니다.
                  </p>

                  <p>
                    ③ 회원은 자신의 계정 및 인증수단을 타인에게 양도,
                    판매, 대여 또는 사용하도록 할 수 없습니다.
                  </p>

                  <p>
                    ④ 회원의 귀책사유로 계정정보 또는 인증수단이 유출되어
                    발생한 손해에 대하여 회사는 회사의 고의 또는 과실이 없는
                    범위에서 책임을 부담하지 않습니다.
                  </p>

                  <p>
                    ⑤ 미성년자인 회원이 법정대리인의 동의가 필요한 거래를
                    하는 경우 관계 법령에서 정하는 절차가 적용될 수 있습니다.
                  </p>
                </div>
              </section>

              {/* 제5조 */}
              <section
                id="service"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제5조 서비스의 내용 및 회사의 역할
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회사는 회원 간 용역 거래가 이루어질 수 있도록 용역의
                    등록·검색·추천, 회원 간 연결, 채팅, 거래관리, 결제 연동,
                    거래기록 확인 등 온라인 플랫폼 기능을 제공합니다.
                  </p>

                  <p>
                    ② 별도의 표시가 없는 한 회사는 의뢰인과 제공자 사이의
                    거래를 연결하는 통신판매중개자의 지위에 있으며,
                    개별 용역 거래의 당사자는 해당 의뢰인과 제공자입니다.
                  </p>

                  <p>
                    ③ 회사가 직접 판매하거나 직접 제공하는 상품 또는 용역은
                    서비스 화면에서 그 사실을 별도로 표시하며, 해당 거래에
                    대해서는 관계 법령 및 별도로 안내되는 거래조건이
                    적용됩니다.
                  </p>

                  <p>
                    ④ 회사는 관계 법령에 따라 필요한 경우 제공자의 신원 및
                    사업자 정보를 확인하고 거래 체결 전에 의뢰인이 확인할 수
                    있도록 제공할 수 있습니다.
                  </p>

                  <p>
                    ⑤ 회사는 서비스 운영상 또는 기술상 필요한 경우 서비스의
                    일부를 변경할 수 있으며, 회원에게 중대한 영향을 미치는
                    변경이 있는 경우 서비스 내에서 사전에 안내합니다.
                  </p>
                </div>
              </section>

              {/* 제6조 */}
              <section
                id="transaction"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제6조 용역 등록 및 거래
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 제공자는 제공하고자 하는 용역의 내용, 가격, 제공기간,
                    작업범위, 수정조건 및 기타 거래조건을 사실에 부합하도록
                    명확하게 등록하여야 합니다.
                  </p>

                  <p>
                    ② 의뢰인은 거래를 신청하기 전에 용역의 내용과 가격,
                    제공기간 및 기타 거래조건을 확인하여야 합니다.
                  </p>

                  <p>
                    ③ 거래는 서비스에서 정한 절차에 따라 의뢰인과 제공자의
                    의사가 합치된 때 성립합니다.
                  </p>

                  <p>
                    ④ 거래 성립 후 용역의 범위, 일정 또는 대금 등을 변경하는
                    경우 당사자는 서비스에서 제공하는 기능이나 확인 가능한
                    방법을 통하여 변경 내용을 명확하게 합의하여야 합니다.
                  </p>

                  <p>
                    ⑤ 제공자는 약정된 내용과 기간에 따라 용역을 제공하여야
                    하며, 의뢰인은 정당한 사유 없이 용역 제공에 필요한 협조를
                    거부하거나 거래를 방해해서는 안 됩니다.
                  </p>

                  <p>
                    ⑥ 관계 법령에 따라 거래가 금지되거나 타인의 권리를
                    침해하는 용역은 등록 또는 거래할 수 없습니다.
                  </p>
                </div>
              </section>

              {/* 제7조 */}
              <section
                id="payment"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제7조 결제·정산·취소 및 환불
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 서비스에서 결제 기능을 제공하는 경우 회원은 회사가
                    제공하거나 연동한 결제수단을 이용하여 거래대금을
                    결제할 수 있습니다.
                  </p>

                  <p>
                    ② 결제 처리는 회사와 계약한 결제대행사 등 외부
                    결제사업자를 통하여 이루어질 수 있으며, 결제수단에 따라
                    해당 사업자의 이용조건이 추가로 적용될 수 있습니다.
                  </p>

                  <p>
                    ③ 제공자에 대한 정산 시기, 정산방법 및 서비스 이용수수료
                    등은 거래 전 서비스 화면 또는 별도의 판매·정산정책을 통해
                    안내합니다.
                  </p>

                  <p>
                    ④ 거래의 취소·환불 여부와 범위는 용역의 진행 상태,
                    당사자 간 합의, 서비스에 사전 고지된 취소·환불정책 및
                    관계 법령에 따라 결정됩니다.
                  </p>

                  <p>
                    ⑤ 서비스의 취소·환불정책이 관계 법령에 따라 보장되는
                    소비자의 청약철회, 계약해제 또는 환불 등의 권리를
                    제한하는 경우에는 관계 법령이 우선합니다.
                  </p>

                  <p>
                    ⑥ 회사는 거래의 안전성 확보 또는 분쟁 해결을 위하여
                    필요한 경우 관계 법령과 사전에 고지한 절차에 따라
                    정산을 일시 보류할 수 있습니다.
                  </p>
                </div>
              </section>

              {/* 제8조 */}
              <section
                id="blockchain"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제8조 블록체인 기반 거래기록
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회사는 거래기록의 무결성 확인, 거래 이력의 검증 또는
                    서비스의 신뢰성 확보를 위하여 블록체인 기술을 이용할 수
                    있습니다.
                  </p>

                  <p>
                    ② 회사는 거래의 체결·진행·완료 등의 사실을 확인하기 위해
                    거래 식별값, 해시값, 기록 시각 또는 기타 필요한 전자적
                    정보를 블록체인 네트워크에 기록할 수 있습니다.
                  </p>

                  <p>
                    ③ 회사는 원칙적으로 회원의 성명, 전화번호, 이메일주소,
                    계좌정보 등 개인을 직접 식별할 수 있는 개인정보 자체를
                    블록체인에 직접 기록하지 않습니다.
                  </p>

                  <p>
                    ④ 블록체인에 기록된 정보는 기술적 특성상 기록 이후
                    임의로 변경하거나 삭제하기 어려울 수 있습니다. 회사는
                    이러한 특성을 고려하여 블록체인에 기록되는 정보를
                    최소화합니다.
                  </p>

                  <p>
                    ⑤ 블록체인에 거래정보가 기록되었다는 사실만으로
                    용역의 정상적인 이행, 검수완료 또는 당사자 사이의
                    법적 분쟁이 최종적으로 확정되는 것은 아닙니다.
                  </p>

                  <p>
                    ⑥ 블록체인 기록은 거래 사실 및 시점 등을 확인하기 위한
                    보조적인 수단으로 이용될 수 있으며, 회원에게 관계 법령상
                    인정되는 계약 취소, 환불, 이의제기 또는 분쟁 해결에 관한
                    권리를 제한하지 않습니다.
                  </p>

                  <p>
                    ⑦ 회사의 고의 또는 과실이 없는 블록체인 네트워크 자체의
                    장애, 외부 네트워크의 변경 등으로 서비스 일부가 일시적으로
                    제한될 수 있으며, 회사는 정상적인 서비스 제공을 위하여
                    합리적인 조치를 취합니다.
                  </p>
                </div>
              </section>

              {/* 제9조 */}
              <section
                id="responsibility"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제9조 회원의 의무 및 금지행위
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회원은 관계 법령, 본 약관, 서비스 내 정책 및 안내사항을
                    준수하여야 합니다.
                  </p>

                  <p>
                    ② 회원은 타인의 개인정보 또는 계정을 무단으로 이용하거나,
                    허위정보를 등록하거나, 다른 회원을 기망하는 행위를
                    해서는 안 됩니다.
                  </p>

                  <p>
                    ③ 회원은 서비스의 정상적인 운영을 방해하거나 시스템에
                    부당하게 접근하여 정보를 변경·훼손하는 행위를 해서는
                    안 됩니다.
                  </p>

                  <p>
                    ④ 회원은 타인의 저작권, 상표권, 개인정보, 명예 등
                    제3자의 권리를 침해하는 용역이나 게시물을 등록하여서는
                    안 됩니다.
                  </p>

                  <p>
                    ⑤ 회원은 관계 법령에서 금지하는 거래 또는 사회질서에
                    반하는 목적으로 서비스를 이용해서는 안 됩니다.
                  </p>

                  <p>
                    ⑥ 제공자는 자신이 제공하는 용역과 관련하여 법령상 필요한
                    자격·허가 등이 있는 경우 이를 적법하게 갖추어야 합니다.
                  </p>
                </div>
              </section>

              {/* 제10조 */}
              <section
                id="privacy"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제10조 개인정보 보호
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회사는 회원의 개인정보를 관계 법령에 따라 보호하며,
                    개인정보의 처리에 관한 구체적인 사항은 별도의
                    개인정보처리방침에서 정합니다.
                  </p>

                  <p>
                    ② 회원가입 또는 서비스 이용 과정에서 개인정보의
                    수집·이용에 대한 동의가 필요한 경우 회사는 해당 내용을
                    이용약관과 구분하여 안내하고 필요한 동의를 받습니다.
                  </p>

                  <p>
                    ③ 거래 수행 등을 위하여 의뢰인 또는 제공자 등 제3자에게
                    개인정보를 제공할 필요가 있고 별도의 동의가 필요한 경우,
                    회사는 제공받는 자, 제공 목적, 제공 항목 및 보유·이용기간
                    등을 안내하고 필요한 동의를 받습니다.
                  </p>

                  <p>
                    ④ 위치정보를 이용하는 기능이 제공되는 경우 관련 사항은
                    별도의 위치기반서비스 이용약관 및 서비스 화면의 안내에
                    따릅니다.
                  </p>
                </div>
              </section>

              {/* 제11조 */}
              <section
                id="content"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제11조 게시물 및 지식재산권
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 서비스와 관련하여 회사가 제작한 디자인, 프로그램,
                    문서 및 기타 콘텐츠에 관한 지식재산권은 회사 또는 정당한
                    권리자에게 귀속됩니다.
                  </p>

                  <p>
                    ② 회원이 서비스에 등록한 게시물의 권리는 해당 회원 또는
                    정당한 권리자에게 귀속됩니다.
                  </p>

                  <p>
                    ③ 회원은 서비스의 운영, 게시물 표시 및 거래 연결 등
                    서비스 제공에 필요한 범위에서 회사가 해당 게시물을
                    이용할 수 있도록 허용합니다.
                  </p>

                  <p>
                    ④ 회사는 게시물이 관계 법령 또는 본 약관을 위반하거나
                    타인의 권리를 침해하는 경우 관련 법령 및 내부 절차에 따라
                    게시물의 노출을 제한하거나 삭제할 수 있습니다.
                  </p>
                </div>
              </section>

              {/* 제12조 */}
              <section
                id="restriction"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제12조 이용 제한 및 계약 해지
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회원은 서비스가 제공하는 절차를 통하여 언제든지
                    회원 탈퇴를 신청할 수 있습니다.
                  </p>

                  <p>
                    ② 진행 중인 거래, 정산, 환불 또는 분쟁이 있는 경우
                    해당 절차가 완료될 때까지 탈퇴 처리 또는 일부 기능의
                    이용이 제한될 수 있습니다.
                  </p>

                  <p>
                    ③ 회원이 관계 법령 또는 본 약관을 위반한 경우 회사는
                    위반의 내용과 정도에 따라 게시물 제한, 서비스 이용정지,
                    계약 해지 등의 조치를 할 수 있습니다.
                  </p>

                  <p>
                    ④ 회사는 원칙적으로 이용 제한 또는 계약 해지 전에 그
                    사유를 회원에게 알리고 의견을 제출할 기회를 제공합니다.
                    다만 긴급한 보안위협, 명백한 불법행위 또는 다른 이용자에게
                    중대한 피해가 발생할 우려가 있는 경우에는 필요한 조치를
                    먼저 한 후 사후 통지할 수 있습니다.
                  </p>
                </div>
              </section>

              {/* 제13조 */}
              <section
                id="liability"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제13조 책임 및 책임의 제한
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 개별 용역 거래의 당사자는 원칙적으로 의뢰인과
                    제공자이며, 각 당사자는 자신이 등록하거나 합의한
                    거래조건과 용역의 이행에 대하여 책임을 부담합니다.
                  </p>

                  <p>
                    ② 회사는 거래 당사자가 아닌 중개 서비스에 관하여
                    제공자가 등록한 용역의 품질, 적법성 또는 거래 상대방의
                    이행능력을 보증하지 않습니다. 다만 회사가 별도로
                    보증한 사항이나 관계 법령에 따라 회사가 부담하여야 하는
                    책임은 제외합니다.
                  </p>

                  <p>
                    ③ 회사는 회원 간 발생한 불만이나 분쟁의 접수,
                    사실관계 확인 및 원활한 해결을 위하여 필요한 조치를
                    취할 수 있습니다.
                  </p>

                  <p>
                    ④ 천재지변, 통신망 장애 또는 회사가 합리적으로 통제하기
                    어려운 사유로 서비스를 제공하지 못한 경우 회사의 책임은
                    관계 법령에 따라 판단합니다.
                  </p>

                  <p>
                    ⑤ 본 약관의 어떠한 내용도 회사의 고의 또는 과실로 인한
                    책임이나 관계 법령에 따라 회원에게 보장되는 권리를
                    부당하게 제한하는 것으로 해석되지 않습니다.
                  </p>
                </div>
              </section>

              {/* 제14조 */}
              <section
                id="dispute"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제14조 분쟁 해결
                </h2>

                <div className="space-y-3 pt-3">
                  <p>
                    ① 회원은 거래 또는 서비스 이용 과정에서 발생한
                    불만·분쟁에 대하여 회사의 고객문의 채널을 통해
                    처리를 요청할 수 있습니다.
                  </p>

                  <p>
                    ② 회사는 접수된 불만 또는 분쟁의 사실관계를 확인하고
                    관계 법령에 따라 필요한 조치를 취합니다.
                  </p>

                  <p>
                    ③ 통신판매중개자에 관한 관계 법령이 적용되는 경우 회사는
                    소비자 불만 또는 분쟁의 원인 및 피해 등을 조사하고,
                    법령에서 정하는 기간과 절차에 따라 진행 경과 및
                    처리방안을 안내합니다.
                  </p>

                  <p>
                    ④ 회사와 회원 사이에 분쟁이 발생한 경우 당사자는
                    원만한 해결을 위해 상호 협의하며, 협의로 해결되지 않는
                    경우 관계 법령에 따른 분쟁조정기관을 이용하거나
                    관할법원에 소를 제기할 수 있습니다.
                  </p>

                  <p>
                    ⑤ 소송이 제기되는 경우 관할법원은 민사소송법 등 관계
                    법령에서 정하는 바에 따릅니다.
                  </p>
                </div>
              </section>

              {/* 제15조 */}
              <section
                id="contact"
                className="scroll-mt-24 border-l-2 border-main/40 pl-5 pt-10"
              >
                <h2 className="text-lg font-bold text-main">
                  제15조 회사 정보 및 문의
                </h2>

                <p className="pt-3">
                  서비스 이용, 거래 및 본 약관과 관련한 문의는 아래
                  고객문의 채널을 이용해 주시기 바랍니다.
                </p>

                <div className="mt-5 rounded-xl bg-zinc-50 p-5 text-sm leading-7">
                  <p>
                    <span className="font-semibold text-zinc-800">
                      서비스명
                    </span>
                    : 잇다
                  </p>

                  <p>
                    <span className="font-semibold text-zinc-800">
                      이메일
                    </span>
                    :{" "}
                    <a
                      href="mailto:itda23d@gmail.com"
                      className="font-semibold text-main hover:text-orange-600"
                    >
                      itda23d@gmail.com
                    </a>
                  </p>
                </div>
              </section>

              <div className="mt-12 border-t border-zinc-200 pt-8">
                <p className="font-semibold text-zinc-700">
                  부칙
                </p>

                <p className="pt-2 text-xs leading-5 text-zinc-400">
                  본 이용약관은 2026년 9월 10일부터 시행합니다.
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