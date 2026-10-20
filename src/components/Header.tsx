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
import { NAV_ITEMS, SIGNIN_PATH } from "@/src/lib/navigation";

const NOTIFICATION_TYPE_STYLE: Record<
  NotificationType,
  { label: string; className: string }
> = {
  chat: { label: "채팅", className: "text-yellow-700 bg-yellow-100" },
  notice: { label: "공지", className: "text-red-600 bg-red-100" },
  call: { label: "부재중", className: "text-red-600 bg-red-100" },
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
    // 시안은 1440px 기준 좌우 120px 여백이다. 좁은 화면에서는 여백을 줄이고,
    // 휴대폰 폭에서는 메뉴 다섯 개가 로고·로그인과 한 줄에 들어가지 않아 하단 바(BottomNav)로 옮긴다
    <div className={`sticky top-0 z-10 shrink-0 bg-white flex items-center justify-between gap-6 h-[60px] px-5 md:px-10 xl:px-[120px] ${!isTop ? "border-b border-line" : ""}`}>

      {/* 로고 / 리스트 */}
      <div className="flex min-w-0 items-center gap-8 lg:gap-20">
        {/* logo.svg(흰 사각형에 글자를 뚫은 형태)에 배경색을 칠해 쓰던 방식은 가장자리에 검은 선이 비쳐서, 투명 배경의 logo.png 를 쓴다.
            글자 영역이 파일의 92x46 이므로 시안의 40x20 에 맞추려면 파일 전체를 42x28 로 키운다 */}
        <Link href="/main" className="shrink-0"><Image src="/logo.png" alt="잇다" width={42} height={28} className="block w-[42px] h-7" /></Link>

        <ul className="hidden md:flex min-w-0 items-center gap-5 lg:gap-7 overflow-x-auto whitespace-nowrap text-sm font-medium leading-none text-neutral-400 [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}><Link href={item.href} className="transition-colors hover:text-main">{item.label}</Link></li>
          ))}
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
              // 휴대폰에서는 알림 버튼이 오른쪽 끝이 아니라 320px 창이 화면 왼쪽 밖으로 나간다. 화면 폭에 맞춰 띄운다
              <div className="fixed inset-x-4 top-16 md:absolute md:inset-x-auto md:right-0 md:top-11 md:w-80 bg-white border border-line rounded-lg shadow-lg overflow-hidden z-50">

                <div className="flex items-center justify-between px-4 py-3 border-b border-line">
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

                          if (n.link) {
                            router.push(n.link);
                          } else if (n.type === "chat" && n.roomId !== null) {
                            router.push(`/chat/${n.roomId}`);
                          }
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-line last:border-b-0 hover:bg-zinc-50 cursor-pointer"
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
                          className="shrink-0 w-6 h-6 rounded-full border border-line flex items-center justify-center text-zinc-400 hover:border-main hover:text-main hover:bg-main/10 cursor-pointer"
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
            <button onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-full overflow-hidden border border-line transition-colors hover:border-main cursor-pointer">
              <Image src={profileImageUrl ? toRelativeUrl(profileImageUrl) : "/profile.webp"} alt="프로필" width={36} height={36} className="w-full h-full object-cover" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-11 w-36 bg-white border border-line rounded-lg shadow-lg overflow-hidden z-50">
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