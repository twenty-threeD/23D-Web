"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { IoNotificationsOutline, IoCheckmark } from "react-icons/io5";
import { useAuthStore } from "@/src/store/authStore";
import { useProfileStore } from "@/src/store/profileStore";
import { logout } from "@/src/lib/auth";
import { getMyProfile } from "@/src/lib/profile";
import { toRelativeUrl } from "@/src/lib/file";
import { useChatNotifications, type NotificationType } from "@/src/hooks/useChatNotifications";
import { SIGNIN_PATH } from "@/src/lib/navigation";

const NOTIFICATION_TYPE_STYLE: Record<
  NotificationType,
  { label: string; className: string }
> = {
  chat: { label: "채팅", className: "text-yellow-700 bg-yellow-100" },
  notice: { label: "공지", className: "text-red-600 bg-red-100" },
};

export default function Header() {
  const [scrollY, setScrollY] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);
  const isPostPage = pathname === "/community";
  const { notifications, unreadCount, markAsRead, clearAll } = useChatNotifications();
  const [ringing, setRinging] = useState(false);
  const profileImageUrl = useProfileStore((s) => s.imageUrl);
  const profileLoaded = useProfileStore((s) => s.loaded);
  const setProfileImageUrl = useProfileStore((s) => s.setImageUrl);

  useEffect(() => {
    if (!token) return;
    if (profileLoaded) return;

    getMyProfile(token)
      .then((res) => setProfileImageUrl(res.data.imageUrl ?? null))
      .catch(() => {});
  }, [token, profileLoaded, setProfileImageUrl]);

  useEffect(() => {
    const [latest] = notifications;
    if (!latest) return;

    setRinging(true);

    const timer = setTimeout(() => setRinging(false), 600);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  function formatNotificationTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleLogout() {
    try {
      await logout(token);
    } catch {}

    clear();
    useProfileStore.getState().reset();
    setShowMenu(false);

    // 로그아웃 후 뒤로가기로 로그인 전용 화면에 돌아가지 않도록 치환한다
    router.replace(SIGNIN_PATH);
  }

  function handleSearch(keyword: string) {
    if (!keyword.trim()) return;
    router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }

      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTop = scrollY === 0;

  return (
    // 시안은 1440px 기준 좌우 120px 여백이다. 좁은 화면에서는 여백을 줄이고 메뉴를 가로 스크롤로 넘겨 줄바꿈으로 높이가 깨지지 않게 한다
    <div className={`sticky top-0 z-10 shrink-0 bg-neutral-50 flex items-center justify-between gap-6 h-[60px] px-5 md:px-10 xl:px-[120px] ${!isTop ? "border-b border-zinc-200" : ""}`}>

      {/* 로고 / 리스트 */}
      <div className="flex min-w-0 items-center gap-8 lg:gap-20">
        {/* logo.svg 는 흰 사각형에 글자를 뚫어 둔 형태라 배경색을 칠해 글자색을 만들고, multiply 로 흰 사각형을 헤더 배경에 녹인다.
            글자 영역이 파일의 92x46 이므로 시안의 40x20 에 맞추려면 파일 전체를 42x28 로 키운다 */}
        <Link href="/main" className="shrink-0"><img src="/logo.svg" alt="잇다" className="block w-[42px] h-7 bg-[#363636] mix-blend-multiply" /></Link>

        <ul className="flex min-w-0 items-center gap-5 lg:gap-7 overflow-x-auto whitespace-nowrap text-sm font-medium leading-none text-neutral-400 [scrollbar-width:none]">
          <li><Link href="/search" className="transition-colors hover:text-main">능력자 찾기</Link></li>
          <li><Link href="/chat" className="transition-colors hover:text-main">채팅</Link></li>
          <li><Link href="/community" className="transition-colors hover:text-main">커뮤니티</Link></li>
          <li><Link href="/upload" className="transition-colors hover:text-main">서비스 등록</Link></li>
          <li><Link href="/blockchain/verify" className="transition-colors hover:text-main">블록체인 검증</Link></li>
        </ul>
      </div>

      {/* 로그인 / 프로필 */}
      {token ? (
        <div className="flex items-center gap-3 shrink-0">

          <div ref={notifRef} className="relative">
            <button onClick={() => setShowNotifications((v) => !v)} className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-100 cursor-pointer" aria-label="알림">
              <IoNotificationsOutline className={`text-xl text-zinc-600 ${ringing ? "animate-bell-ring" : ""}`} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-main" />}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-50">

                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <span className="text-sm font-bold">알림</span>
                  {notifications.length > 0 && <button onClick={clearAll} className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer">모두 지우기</button>}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-zinc-400">새 알림이 없습니다.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowNotifications(false);

                          if (n.type === "chat" && n.roomId !== null) {
                            router.push(`/chat/${n.roomId}`);
                          }
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer"
                      >
                        <span className={`shrink-0 mt-0.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${NOTIFICATION_TYPE_STYLE[n.type].className}`}>{NOTIFICATION_TYPE_STYLE[n.type].label}</span>

                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold truncate">{n.senderName}</span>
                            <span className="text-[11px] text-zinc-400 shrink-0">{formatNotificationTime(n.createdAt)}</span>
                          </div>

                          <span className="text-xs text-zinc-500 truncate w-full">{n.message}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="shrink-0 w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-400 hover:border-main hover:text-main hover:bg-main/10 cursor-pointer"
                          aria-label="읽음 처리"
                        >
                          <IoCheckmark className="text-sm" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

          <div ref={menuRef} className="relative">
            <button onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-full overflow-hidden border border-zinc-300 transition-colors hover:border-main cursor-pointer">
              <Image src={profileImageUrl ? toRelativeUrl(profileImageUrl) : "/profile.png"} alt="프로필" width={36} height={36} className="w-full h-full object-cover" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-11 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-50">
                <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50">프로필</Link>
                <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-zinc-50 cursor-pointer">로그아웃</button>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium leading-none text-neutral-400">
          <Link href={SIGNIN_PATH} className="transition-colors hover:text-main">로그인</Link>
          <span aria-hidden>|</span>
          <Link href="/login/signup" className="transition-colors hover:text-main">회원가입</Link>
        </div>
      )}

    </div>
  );
}