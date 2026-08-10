"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { IoNotificationsOutline, IoCheckmark } from "react-icons/io5";
import Search from "./Search";
import { useAuthStore } from "@/src/store/authStore";
import { logout } from "@/src/lib/auth";
import { useChatNotifications, type NotificationType } from "@/src/hooks/useChatNotifications";
import { useToast } from "@/src/hooks/useToast";

const NOTIFICATION_TYPE_STYLE: Record<NotificationType, { label: string; className: string }> = {
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
  const { addToast } = useToast();
  const { notifications, unreadCount, markAsRead, clearAll } = useChatNotifications();

  useEffect(() => {
    const [latest] = notifications;
    if (latest) addToast({ message: `${latest.senderName}: ${latest.message}`, type: "info" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  function formatNotificationTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("ko-KR", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  async function handleLogout() {
    try {
      await logout(token);
    } catch {}
    clear();
    setShowMenu(false);
    router.push("/login/signin");
  }

  function handleSearch(keyword: string) {
    if (!keyword.trim()) return;
    router.push(`/main?keyword=${encodeURIComponent(keyword)}`);
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
    <div className={`sticky top-0 z-10 bg-white flex items-center justify-between h-16 px-20 ${!isTop ? "border-b border-zinc-300" : ""}`}>
      {/* 로고 / 리스트 */}
      <div className="flex gap-8 items-center">
        <Link href="/main">
          <img src="/icon.png" alt="Logo" className="h-7"/>
        </Link>
        <ul className="flex gap-4">
          <li><Link href="/main" className="text-zinc-500 text-sm font-semibold ">능력자 찾기</Link></li>
          <li><Link href="/chat" className="text-zinc-500 text-sm font-semibold">채팅</Link></li>
          <li><Link href="/community" className="text-zinc-500 text-sm font-semibold">커뮤니티</Link></li>
          <li><Link href="/upload" className="text-zinc-500 text-sm font-semibold">서비스 등록</Link></li>
        </ul>
      </div>

      {/* 검색창 */}
      <Search isTop={isPostPage ? true : isTop} where="header" onSearch={handleSearch} />

      {/* 로그인 / 프로필 */}
      {token ? (
        <div className="flex items-center gap-3 shrink-0">
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-100 cursor-pointer"
              aria-label="알림"
            >
              <IoNotificationsOutline className="text-xl text-zinc-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-main" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <span className="text-sm font-bold">알림</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      모두 지우기
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-zinc-400">새 알림이 없습니다.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => { setShowNotifications(false); router.push(`/chat/${n.roomId}`); }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer ${n.read ? "opacity-50" : ""}`}
                      >
                        <span className={`shrink-0 mt-0.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${NOTIFICATION_TYPE_STYLE[n.type].className}`}>
                          {NOTIFICATION_TYPE_STYLE[n.type].label}
                        </span>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold truncate">{n.senderName}</span>
                            <span className="text-[11px] text-zinc-400 shrink-0">{formatNotificationTime(n.createdAt)}</span>
                          </div>
                          <span className="text-xs text-zinc-500 truncate w-full">{n.message}</span>
                        </div>
                        {!n.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="shrink-0 w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-400 hover:border-main hover:text-main hover:bg-main/10 cursor-pointer"
                            aria-label="읽음 처리"
                          >
                            <IoCheckmark className="text-sm" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="w-9 h-9 rounded-full overflow-hidden border border-zinc-300 cursor-pointer"
            >
              <Image src="/profile.png" alt="프로필" width={36} height={36} className="w-full h-full object-cover" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-11 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-50">
                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  프로필
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-zinc-50 cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link href="/login/signin" className="text-zinc-500 text-sm font-semibold">
          로그인 / 회원가입
        </Link>
      )}
    </div>
  );
}