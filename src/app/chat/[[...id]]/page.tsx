"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/src/components/Header"
import Image from "next/image"
import { IoClose, IoSend } from "react-icons/io5"
import Search from "@/src/components/Search"
import { HiDotsHorizontal } from "react-icons/hi"
import { MdOutlineImage, MdOutlineDescription, MdOutlineAssignment } from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { getChatRooms, getChatMessages } from "@/src/lib/chat"
import { toRelativeUrl } from "@/src/lib/file"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import ContractModal from "@/src/components/chat/ContractModal"

type Tab = "received" | "sent" | "done"

interface ChatRoom {
  roomId: number
  participantUsername: string
  participantName: string
  lastMessagePreview: string
  lastMessageAt: string
}

interface Message {
  messageId: number
  roomId: number
  senderUsername: string
  senderName: string
  message: string
  createdAt: string
  attachedFileUrls: string[]
}

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const myUsername = useAuthStore((s) => {
    if (s.username) return s.username
    if (!s.accessToken) return null
    try {
      const p = JSON.parse(atob(s.accessToken.split('.')[1]))
      return p.username ?? p.sub ?? null
    } catch { return null }
  })
  const selectedId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null

  const [tab, setTab] = useState<Tab>("received")
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [showAttach, setShowAttach] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const stompClientRef = useRef<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!token) return
    try {
      const p = JSON.parse(atob(token.split('.')[1]))
      console.log('[chat] JWT payload:', p, '| myUsername:', myUsername)
    } catch {}
  }, [token, myUsername])

  useEffect(() => {
    if (!selectedId || !token) return

    const sockjsUrl = `${window.location.protocol}//${window.location.host}/ws-stomp?token=${token}`

    const client = new Client({
      webSocketFactory: () => new SockJS(sockjsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        client.subscribe(`/topic/chat/rooms/${selectedId}`, (frame) => {
          try {
            const msg: Message = JSON.parse(frame.body)
            console.log('[chat] msg.senderUsername:', msg.senderUsername)
            setMessages((prev) => [...prev, msg])
          } catch {}
        })
      },
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
      stompClientRef.current = null
    }
  }, [selectedId, token])

  const fetchRooms = useCallback(async () => {
    if (!token) return
    setLoadingRooms(true)
    try {
      const res = await getChatRooms(token)
      setRooms(res.data ?? [])
    } catch {
      setRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }, [token])

  const fetchMessages = useCallback(async () => {
    if (!token || !selectedId) return
    setLoadingMessages(true)
    try {
      const res = await getChatMessages(token, selectedId as number)
      const raw = res.data ?? res
      const list: Message[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
      setMessages(list)
    } catch (e) {
      console.error("[chat] getChatMessages error:", e)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [token, selectedId])

  useEffect(() => { fetchRooms() }, [fetchRooms])
  useEffect(() => { fetchMessages() }, [fetchMessages])

  const selectedRoom = rooms.find((r) => r.roomId === selectedId)

  const tabs: { key: Tab; label: string }[] = [
    { key: "received", label: "받은 견적" },
    { key: "sent", label: "보낸 견적" },
    { key: "done", label: "완료된 거래" },
  ]

  const filteredRooms = rooms.filter((r) => r.participantName.includes(search))

  function handleSend() {
    if (!message.trim()) return
    const client = stompClientRef.current
    if (!client?.connected) return

    const body = JSON.stringify({ roomId: selectedId, message, fileUrls: [] })
    client.publish({
      destination: "/app/chat.send",
      headers: { Authorization: `Bearer ${token}` },
      body,
    })
    setMessage("")
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      {showContract && selectedRoom && (
        <ContractModal
          roomId={selectedId ?? 0}
          client={{ name: selectedRoom.participantName, items: [{ label: "아이디", value: selectedRoom.participantUsername }] }}
          professional={{ name: myUsername ?? "", items: [{ label: "아이디", value: myUsername ?? "" }] }}
          contractContent=""
          date={new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          myRole="professional"
          onClose={() => setShowContract(false)}
          onSubmit={(data) => {
            console.log("계약서 서명 완료", data)
            setShowContract(false)
          }}
        />
      )}

      <div className="flex flex-1 px-20 pt-8 overflow-hidden">
        {/* 왼쪽 채팅 목록 */}
        <div className="flex flex-col w-120 pr-4 shrink-0 border-r border-zinc-200">
          {/* 탭 */}
          <div className="flex border-b border-zinc-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-4 text-lg font-semibold border-b-2 transition-colors cursor-pointer ${
                  tab === t.key
                    ? "border-zinc-800 text-zinc-800 font-bold"
                    : "border-transparent text-zinc-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="py-3">
            <Search where="chat" onSearch={setSearch} />
          </div>

          {/* 채팅 목록 */}
          <div className="flex flex-col flex-1 overflow-y-auto rounded-md">
            {loadingRooms ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-zinc-200 shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-24 bg-zinc-200 rounded" />
                    <div className="h-3 w-32 bg-zinc-200 rounded" />
                  </div>
                </div>
              ))
            ) : filteredRooms.length === 0 ? (
              <p className="text-center text-zinc-400 text-sm py-8">채팅방이 없습니다.</p>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.roomId}
                  onClick={() => router.push(`/chat/${room.roomId}`)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-left hover:bg-zinc-50 ${
                    room.roomId === selectedId ? "bg-zinc-100" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                    <Image src="/profile.png" alt={room.participantName} width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold">{room.participantName}</span>
                    <span className="text-xs text-zinc-400 truncate">{room.lastMessagePreview}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-zinc-400">{room.lastMessageAt ? formatTime(room.lastMessageAt) : ""}</span>
                    {room.roomId === selectedId && (
                      <HiDotsHorizontal className="text-zinc-400 text-base" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽 채팅창 */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {selectedRoom ? (
            <>
              {/* 채팅 헤더 */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                  <Image src="/profile.png" alt={selectedRoom.participantName} width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{selectedRoom.participantName}</span>
                  <span className="text-xs text-zinc-400">@{selectedRoom.participantUsername}</span>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex flex-col flex-1 overflow-y-auto px-6 py-6 gap-4">
                {loadingMessages ? (
                  <p className="text-center text-zinc-400 text-sm">불러오는 중...</p>
                ) : messages.map((msg) => {
                  const isSent = msg.senderUsername === myUsername
                  const hasImage = msg.attachedFileUrls?.length > 0
                  return (
                    <div key={msg.messageId}>
                      {!isSent ? (
                        <div className="flex items-end gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                            <Image src="/profile.png" alt="" width={36} height={36} className="w-full h-full object-cover" />
                          </div>
                          {hasImage ? (
                            <div className="w-48 rounded-xl overflow-hidden">
                              <img src={toRelativeUrl(msg.attachedFileUrls[0])} alt="첨부 이미지" className="w-full h-auto" />
                            </div>
                          ) : (
                            <div className="bg-zinc-100 rounded-2xl rounded-bl-none px-4 py-2 max-w-xs">
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          )}
                          <span className="text-xs text-zinc-400 shrink-0">{formatTime(msg.createdAt)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-end items-end gap-2">
                          <span className="text-xs text-zinc-400">{formatTime(msg.createdAt)}</span>
                          {hasImage ? (
                            <div className="w-48 rounded-xl overflow-hidden">
                              <img src={toRelativeUrl(msg.attachedFileUrls[0])} alt="첨부 이미지" className="w-full h-auto" />
                            </div>
                          ) : (
                            <div className="bg-main rounded-2xl rounded-br-none px-4 py-2 max-w-xs">
                              <p className="text-sm text-white">{msg.message}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-zinc-400 text-sm">채팅방을 선택해주세요.</p>
            </div>
          )}

          {/* 입력 영역 */}
          {selectedRoom && (
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
                    <button
                      onClick={() => { setShowAttach(false); setShowContract(true) }}
                      className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer"
                    >
                      <MdOutlineAssignment className="text-white text-2xl" />
                    </button>
                    <span className="text-xs text-zinc-500">계약서</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-2 rounded-lg border border-zinc-200">
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
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend() }}
                />
                <button
                  onClick={handleSend}
                  className="w-9 h-9 rounded-full bg-main flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <IoSend className="text-white text-base" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
