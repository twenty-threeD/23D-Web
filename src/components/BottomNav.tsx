"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { IconType } from "react-icons"
import {
  IoAddCircle,
  IoAddCircleOutline,
  IoChatbubbles,
  IoChatbubblesOutline,
  IoPeople,
  IoPeopleOutline,
  IoSearch,
  IoSearchOutline,
  IoShieldCheckmark,
  IoShieldCheckmarkOutline,
} from "react-icons/io5"
import { NAV_ITEMS } from "@/src/lib/navigation"

// 지금 있는 메뉴는 채운 아이콘으로, 나머지는 선 아이콘으로 구분한다
const ICONS: Record<(typeof NAV_ITEMS)[number]["href"], { on: IconType; off: IconType }> = {
  "/search": { on: IoSearch, off: IoSearchOutline },
  "/chat": { on: IoChatbubbles, off: IoChatbubblesOutline },
  "/community": { on: IoPeople, off: IoPeopleOutline },
  "/upload": { on: IoAddCircle, off: IoAddCircleOutline },
  "/blockchain/verify": { on: IoShieldCheckmark, off: IoShieldCheckmarkOutline },
}

// 메뉴 경로 밖이지만 그 메뉴에 속하는 화면. 커뮤니티 글 상세는 /posts, 블록 목록은 /blockchain/more 다
const ALSO_ACTIVE: Partial<Record<(typeof NAV_ITEMS)[number]["href"], string[]>> = {
  "/community": ["/posts"],
  "/blockchain/verify": ["/blockchain/more"],
}

// 휴대폰은 엄지가 닿기 쉬운 가운데에 서비스 등록을 두고, 자주 여는 커뮤니티·능력자 찾기를 앞에 둔다.
// 헤더 가로 메뉴는 기존 순서를 그대로 쓰므로 NAV_ITEMS 를 바꾸지 않고 하단 바에서만 순서를 정한다
const MOBILE_ORDER: (typeof NAV_ITEMS)[number]["href"][] = [
  "/community",
  "/search",
  "/upload",
  "/chat",
  "/blockchain/verify",
]
const MOBILE_ITEMS = MOBILE_ORDER.flatMap((href) => NAV_ITEMS.filter((item) => item.href === href))

function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

// 휴대폰 폭에서만 쓰는 하단 메뉴. 헤더에는 로고·알림·프로필만 남는다.
// 홈 인디케이터가 있는 기기에서 버튼이 가려지지 않도록 안전 영역만큼 아래를 띄운다
export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="grid h-16 grid-cols-5">
        {MOBILE_ITEMS.map((item) => {
          // 상세 화면(/chat/12, /blockchain/verify/detail/…)에서도 그 메뉴가 켜져 있어야 위치를 알 수 있다
          const active = [item.href, ...(ALSO_ACTIVE[item.href] ?? [])].some((base) => isUnder(pathname, base))
          const Icon = active ? ICONS[item.href].on : ICONS[item.href].off
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex size-full flex-col items-center justify-center gap-1 transition-colors ${active ? "text-main" : "text-zinc-400"}`}
              >
                <Icon className="text-[22px]" />
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
