"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/src/components/Header"
import Image from "next/image"
import { IoIosSearch } from "react-icons/io"
import { IoClose, IoSend } from "react-icons/io5"
import { HiDotsHorizontal } from "react-icons/hi"
import { MdOutlineImage, MdOutlineDescription, MdOutlineAssignment } from "react-icons/md"

type Tab = "received" | "sent" | "done"

interface ChatItem {
  id: number
  name: string
  lastMessage: string
  time: string
  online: boolean
}

interface Message {
  id: number
  type: "received" | "sent"
  content?: string
  image?: string
  date?: string
}

const DUMMY_CHATS: ChatItem[] = [
  { id: 1, name: "안재민님", lastMessage: "안녕하세요", time: "1일전", online: true },
  { id: 2, name: "이용인님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 3, name: "김경윤님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 4, name: "김승우님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 5, name: "조상철님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 6, name: "우성민님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 7, name: "채근영포티님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 8, name: "김일강님", lastMessage: "안녕하세요", time: "1일전", online: false },
  { id: 9, name: "장강민님", lastMessage: "안녕하세요", time: "1일전", online: false },
]

const DUMMY_MESSAGES: Message[] = [
  { id: 1, type: "received", content: "사업자 등록증좀 볼수 있을까요?", date: "2026. 04. 21. 오후 1:43" },
  { id: 2, type: "sent", image: "/certificate.png" },
  { id: 3, type: "sent", content: "넵" },
  { id: 4, type: "sent", content: "보냈습니다" },
  { id: 5, type: "received", content: "넵 감사합니다" },
  { id: 6, type: "sent", content: "그래서 계약하시겠어요?" },
]

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const selectedId = Number(params.id)

  const [tab, setTab] = useState<Tab>("received")
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [showAttach, setShowAttach] = useState(false)

  const selectedChat = DUMMY_CHATS.find((c) => c.id === selectedId) ?? DUMMY_CHATS[0]

  const tabs: { key: Tab; label: string }[] = [
    { key: "received", label: "받은 견적" },
    { key: "sent", label: "보낸 견적" },
    { key: "done", label: "완료된 거래" },
  ]

  const filteredChats = DUMMY_CHATS.filter((c) =>
    c.name.includes(search)
  )

  function handleSend() {
    if (!message.trim()) return
    setMessage("")
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 채팅 목록 */}
        <div className="flex flex-col w-120 shrink-0 border-r border-zinc-200">
          {/* 탭 */}
          <div className="flex border-b border-zinc-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  tab === t.key
                    ? "border-zinc-800 text-zinc-800"
                    : "border-transparent text-zinc-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg">
              <IoIosSearch className="text-zinc-400 text-xl shrink-0" />
              <input
                className="text-sm focus:outline-none w-full"
                placeholder="검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 채팅 목록 */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-left hover:bg-zinc-50 ${
                  chat.id === selectedId ? "bg-zinc-100" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                  <Image src="/profile.png" alt={chat.name} width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold">{chat.name}</span>
                  <span className="text-xs text-zinc-400 truncate">{chat.lastMessage}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-zinc-400">{chat.time}</span>
                  {chat.id === selectedId && (
                    <HiDotsHorizontal className="text-zinc-400 text-base" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 오른쪽 채팅창 */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 채팅 헤더 */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-zinc-200">
              <Image src="/profile.png" alt={selectedChat.name} width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{selectedChat.name}</span>
              <span className="text-xs text-zinc-400">
                {selectedChat.online ? "지금 활동중" : "비활동중"}
              </span>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex flex-col flex-1 overflow-y-auto px-6 py-6 gap-4">
            {DUMMY_MESSAGES.map((msg) => (
              <div key={msg.id}>
                {msg.date && (
                  <div className="flex justify-center py-2">
                    <span className="text-xs text-zinc-400">{msg.date}</span>
                  </div>
                )}
                {msg.type === "received" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                      <Image src="/profile.png" alt="" width={36} height={36} className="w-full h-full object-cover" />
                    </div>
                    {msg.content && (
                      <div className="bg-zinc-100 rounded-2xl px-4 py-2 max-w-xs">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-end">
                    {msg.image ? (
                      <div className="w-48 rounded-xl overflow-hidden">
                        <img src={msg.image} alt="첨부 이미지" className="w-full h-auto" />
                      </div>
                    ) : (
                      <div className="bg-main rounded-2xl px-4 py-2 max-w-xs">
                        <p className="text-sm text-white">{msg.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 입력 영역 */}
          <div className="shrink-0 border-t border-zinc-200 px-6 py-4 flex flex-col gap-3">
            {showAttach && (
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-1">
                  <button className="w-12 h-12 rounded-full bg-main flex items-center justify-center cursor-pointer">
                    <MdOutlineImage className="text-white text-2xl" />
                  </button>
                  <span className="text-xs text-zinc-500">사진</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button className="w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center cursor-pointer">
                    <MdOutlineDescription className="text-white text-2xl" />
                  </button>
                  <span className="text-xs text-zinc-500">문서</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer">
                    <MdOutlineAssignment className="text-white text-2xl" />
                  </button>
                  <span className="text-xs text-zinc-500">계약서</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAttach((v) => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                  showAttach ? "bg-main" : "bg-zinc-200"
                }`}
              >
                <IoClose className={`text-xl ${showAttach ? "text-white" : "text-zinc-500"}`} />
              </button>
              <input
                className="flex-1 text-sm focus:outline-none"
                placeholder="메시지 입력"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="w-9 h-9 rounded-full bg-main flex items-center justify-center shrink-0 cursor-pointer"
              >
                <IoSend className="text-white text-base" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
