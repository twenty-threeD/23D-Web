import Image from "next/image"
import Link from "next/link";

const FOOTER_LINK_GROUPS = [
  {
    title: "빠른 링크",
    links: [
      { label: "프로젝트 소개", href: "/about" },
      { label: "커뮤니티", href: "/community" },
      { label: "팀원소개", href: "/team" },
      // 블록체인 설명 전용 페이지가 아직 없어 문서 페이지로 보낸다
      { label: "블록체인이란?", href: "/docs" },
    ],
  },
  {
    title: "문의 • 지원",
    links: [
      { label: "문서", href: "/docs" },
      { label: "개인정보처리방침", href: "/privateinfo" },
      { label: "이용약관", href: "/eula" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "인스타그램", href: "https://www.instagram.com/idta.blockchain/", icon: "/instagram.svg" },
  { label: "깃허브", href: "https://github.com/twenty-threeD/23D-Web", icon: "/github.svg" },
];

export default function Footer() {
  return (
    // 시안은 1440px 기준 좌우 120px 여백이다. 상하 여백은 40px 이며, 좁은 화면에서는 여백을 줄이고 블록을 세로로 쌓는다
    <footer className="bg-neutral-50 px-5 md:px-10 xl:px-[120px] py-8 lg:py-10">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">

        <div className="flex flex-col gap-10 md:flex-row md:gap-16 lg:gap-[100px]">
          {/* 로고 / 소개 */}
          <div className="flex flex-col gap-5">
            {/* Header 와 같은 logo.svg 를 쓴다. 글자 영역(92x46)이 시안의 60x30 이 되도록 파일 전체를 63x42 로 키우고,
                파일 위아래 여백이 생기므로 시안의 로고~문구 간격(26px)에서 그만큼 뺀 gap 을 준다 */}
            <Image src="/logo.svg" alt="잇다" width={63} height={42} className="block w-[63px] h-[42px] bg-[#363636] mix-blend-multiply" />

            <div className="flex flex-col gap-2 text-neutral-400">
              <p className="text-sm leading-[normal]">
                필요한 순간, 필요한 능력자를 찾을 수 있는,
                <br />
                블록체인 기반 용역 중개 플랫폼, 잇다 입니다.
              </p>
              <small className="text-xs leading-[normal]">Copyright © 2026 ITDA. All rights reserved.</small>
            </div>
          </div>

          {/* 링크 */}
          <div className="flex gap-16">
            {FOOTER_LINK_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-4 min-w-[92px]">
                <h3 className="text-xl font-semibold leading-none text-[#5d5d5d] whitespace-nowrap">{group.title}</h3>

                <ul className="flex flex-col gap-3 text-xs font-medium leading-none text-neutral-400">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="whitespace-nowrap transition-colors hover:text-main">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* SNS */}
        <div className="flex gap-4">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              className="flex items-center justify-center size-9 rounded-md border border-[#363636] transition-colors hover:bg-neutral-200"
            >
              {/* 기존 아이콘은 viewBox 전체를 채우는 검정 아이콘이라, 시안의 아이콘 영역(22px)에 맞춰 크기만 지정하고
                  투명도로 시안 색(#363636)에 가깝게 맞춘다 */}
              <Image src={social.icon} alt="" width={22} height={22} className="block size-[22px] opacity-80" />
            </a>
          ))}
        </div>

      </div>
    </footer>
  );
}
