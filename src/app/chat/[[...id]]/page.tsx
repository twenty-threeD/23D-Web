"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/src/components/Header"
import Image from "next/image"
import { IoClose, IoSend, IoAdd } from "react-icons/io5"
import Search from "@/src/components/Search"
import { HiDotsHorizontal } from "react-icons/hi"
import { MdOutlineImage, MdOutlineDescription, MdOutlineAssignment } from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
import { getChatRooms, getChatMessages, deleteChatRoom } from "@/src/lib/chat"
import { toRelativeUrl, uploadFile } from "@/src/lib/file"
import { useHandleError } from "@/src/hooks/useHandleError"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import ContractModal from "@/src/components/chat/ContractModal"

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url)
}

function fileNameFromUrl(url: string) {
  try {
    const decoded = decodeURIComponent(url.split("/").pop() ?? "첨부파일")
    return decoded.replace(/^\d+[-_]/, "")
  } catch {
    return "첨부파일"
  }
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",")
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png"
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

type Tab = "received" | "sent" | "done"

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
  const rooms = useChatRoomsStore((s) => s.rooms)
  const setRoomsInStore = useChatRoomsStore((s) => s.setRooms)
  const unreadRoomIds = useChatRoomsStore((s) => s.unreadRoomIds)
  const lastMessageOverride = useChatRoomsStore((s) => s.lastMessageOverride)
  const markRoomRead = useChatRoomsStore((s) => s.markRoomRead)
  const setActiveRoomId = useChatRoomsStore((s) => s.setActiveRoomId)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingRooms, setLoadingRooms] = useState(() => !useChatRoomsStore.getState().loaded)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [pendingDocUrl, setPendingDocUrl] = useState<string | null>(null)
  const [pendingDocName, setPendingDocName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const stompClientRef = useRef<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const handleError = useHandleError()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setActiveRoomId(selectedId)
    return () => setActiveRoomId(null)
  }, [selectedId, setActiveRoomId])

  useEffect(() => {
    if (!selectedId || !token) return

    markRoomRead(selectedId)

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
            setMessages((prev) => [...prev, msg])
            markRoomRead(selectedId)
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
    if (!useChatRoomsStore.getState().loaded) setLoadingRooms(true)
    try {
      const res = await getChatRooms(token)
      setRoomsInStore(res.data ?? [])
    } catch {
      setRoomsInStore([])
    } finally {
      setLoadingRooms(false)
    }
  }, [token, setRoomsInStore])

  const fetchMessages = useCallback(async () => {
    if (!token || !selectedId) return
    setLoadingMessages(true)
    try {
      const res = await getChatMessages(token, selectedId as number)
      const raw = res.data ?? res
      const list: Message[] = Array.isArray(raw) ? raw : (raw?.content ?? [])
      setMessages(list)
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [token, selectedId])

  useEffect(() => { fetchRooms() }, [fetchRooms])
  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function handleDeleteRoom(e: React.MouseEvent, roomId: number) {
    e.stopPropagation()
    if (!token) return
    if (!confirm("채팅방을 삭제하시겠습니까?")) return
    try {
      await deleteChatRoom(token, roomId)
      setRoomsInStore(rooms.filter((r) => r.roomId !== roomId))
      if (selectedId === roomId) router.push("/chat")
    } catch (e) {
      handleError(e)
    }
  }

  const selectedRoom = rooms.find((r) => r.roomId === selectedId)

  const tabs: { key: Tab; label: string }[] = [
    { key: "received", label: "받은 견적" },
    { key: "sent", label: "보낸 견적" },
    { key: "done", label: "완료된 거래" },
  ]

  const filteredRooms = rooms.filter((r) => r.participantName.includes(search))

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    const preview = URL.createObjectURL(file)
    setPendingPreview(preview)
    setShowAttach(false)
    setUploading(true)
    try {
      const { url } = await uploadFile(token, file)
      setPendingImageUrl(url)
    } catch {
      URL.revokeObjectURL(preview)
      setPendingPreview(null)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function clearPendingImage() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingPreview(null)
    setPendingImageUrl(null)
  }

  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setPendingDocName(file.name)
    setShowAttach(false)
    setUploading(true)
    try {
      const { url } = await uploadFile(token, file)
      setPendingDocUrl(url)
    } catch {
      setPendingDocName(null)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function clearPendingDoc() {
    setPendingDocUrl(null)
    setPendingDocName(null)
  }

  function handleSend() {
    if (!message.trim() && !pendingImageUrl && !pendingDocUrl) return
    const client = stompClientRef.current
    if (!client?.connected || uploading) return

    const fileUrls = pendingImageUrl ? [pendingImageUrl] : pendingDocUrl ? [pendingDocUrl] : []
    const body = JSON.stringify({
      roomId: selectedId,
      message: message.trim() || "",
      fileUrls,
    })
    client.publish({
      destination: "/app/chat.send",
      headers: { Authorization: `Bearer ${token}` },
      body,
    })
    setMessage("")
    clearPendingImage()
    clearPendingDoc()
  }

  async function handleContractSubmit(data: { clientSig: string; professionalSig: string; clientName: string; professionalName: string }) {
    if (!token || !selectedId) return
    const client = stompClientRef.current
    if (!client?.connected) return

    const mySig = data.professionalSig || data.clientSig
    const summary = `[계약서 서명 완료]\n갑(의뢰인): ${data.clientName}\n을(수행자): ${data.professionalName}`

    let fileUrls: string[] = []
    if (mySig) {
      try {
        const file = dataUrlToFile(mySig, `contract-signature-${Date.now()}.png`)
        const { url } = await uploadFile(token, file)
        fileUrls = [url]
      } catch (e) {
        handleError(e)
      }
    }

    client.publish({
      destination: "/app/chat.send",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ roomId: selectedId, message: summary, fileUrls }),
    })
    setShowContract(false)
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
          onSubmit={handleContractSubmit}
        />
      )}

      <div className="flex flex-1 px-20 pt-8 overflow-hidden">
        {/* 왼쪽 채팅 목록 */}
        <div className="flex flex-col pr-4 shrink-0 border-r border-zinc-200">
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
              filteredRooms.map((room) => {
                const isUnread = !!unreadRoomIds[room.roomId]
                const previewText = isUnread ? "새 메시지" : (lastMessageOverride[room.roomId] ?? room.lastMessagePreview)
                return (
                <div
                  key={room.roomId}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/chat/${room.roomId}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/chat/${room.roomId}`) }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-left hover:bg-zinc-50 ${
                    room.roomId === selectedId ? "bg-zinc-100" : ""
                  }`}
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <Image src="/profile.png" alt={room.participantName} width={48} height={48} className="w-full h-full object-cover rounded-full" />
                    {isUnread && <span className="absolute top-0 -right-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{room.participantName}</span>
                    </div>
                    <span className={`text-xs truncate ${isUnread ? "text-zinc-700 font-semibold" : "text-zinc-400"}`}>{previewText}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-zinc-400">{room.lastMessageAt ? formatTime(room.lastMessageAt) : ""}</span>
                    {room.roomId === selectedId && (
                      <button
                        onClick={(e) => handleDeleteRoom(e, room.roomId)}
                        className="text-zinc-400 hover:text-red-500 text-base cursor-pointer"
                        aria-label="채팅방 삭제"
                      >
                        <HiDotsHorizontal />
                      </button>
                    )}
                  </div>
                </div>
                )
              })
            )}
          </div>
        </div>

        {/* 오른쪽 채팅창 */}
        <div className="flex flex-col flex-1 w-1/2 overflow-hidden">
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
                  const attachedUrl = msg.attachedFileUrls?.[0]
                  const isImage = attachedUrl ? isImageUrl(attachedUrl) : false

                  const attachment = attachedUrl ? (
                    isImage ? (
                      <div className="w-48 rounded-xl overflow-hidden">
                        <img src={toRelativeUrl(attachedUrl)} alt="첨부 이미지" className="w-full h-auto" />
                      </div>
                    ) : (
                      <a
                        href={toRelativeUrl(attachedUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-zinc-100 rounded-xl px-3 py-2 max-w-xs hover:bg-zinc-200"
                      >
                        <MdOutlineDescription className="text-lg text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-600 truncate">{fileNameFromUrl(attachedUrl)}</span>
                      </a>
                    )
                  ) : null

                  const textBubble = msg.message ? (
                    <div className={`rounded-2xl px-4 py-2 max-w-xs ${isSent ? "bg-main rounded-br-none" : "bg-zinc-100 rounded-bl-none"}`}>
                      <p className={`text-sm whitespace-pre-line ${isSent ? "text-white" : ""}`}>{msg.message}</p>
                    </div>
                  ) : null

                  return (
                    <div key={msg.messageId}>
                      {!isSent ? (
                        <div className="flex items-end gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                            <Image src="/profile.png" alt="" width={36} height={36} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col gap-1">
                            {attachment}
                            {textBubble}
                          </div>
                          <span className="text-xs text-zinc-400 shrink-0">{formatTime(msg.createdAt)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-end items-end gap-2">
                          <span className="text-xs text-zinc-400">{formatTime(msg.createdAt)}</span>
                          <div className="flex flex-col gap-1 items-end">
                            {attachment}
                            {textBubble}
                          </div>
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
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-main flex items-center justify-center cursor-pointer"
                    >
                      <MdOutlineImage className="text-white text-2xl" />
                    </button>
                    <span className="text-xs text-zinc-500">사진</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => docInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center cursor-pointer"
                    >
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

              {pendingPreview && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <img src={pendingPreview} alt="첨부 이미지" className="w-full h-full object-cover" />
                  {uploading ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs">업로드 중</span>
                    </div>
                  ) : (
                    <button
                      onClick={clearPendingImage}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <IoClose className="text-white text-xs" />
                    </button>
                  )}
                </div>
              )}

              {pendingDocName && (
                <div className="relative flex items-center gap-2 bg-zinc-100 rounded-lg px-3 py-2 w-fit shrink-0">
                  <MdOutlineDescription className="text-lg text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-600 truncate max-w-40">{pendingDocName}</span>
                  {uploading ? (
                    <span className="text-xs text-zinc-400">업로드 중</span>
                  ) : (
                    <button onClick={clearPendingDoc} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                      <IoClose className="text-sm" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 p-2 rounded-lg border border-zinc-200">
                <button
                  onClick={() => setShowAttach((v) => !v)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    showAttach ? "bg-main" : "bg-zinc-200"
                  }`}
                >
                  <IoAdd className={`text-xl transition-transform duration-200 ${showAttach ? "text-white rotate-45" : "text-zinc-500"}`} />
                </button>
                <input
                  className="flex-1 text-sm focus:outline-none"
                  placeholder="메시지 입력"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => { if (selectedId) markRoomRead(selectedId) }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend() }}
                />
                <button
                  onClick={handleSend}
                  disabled={uploading}
                  className="w-9 h-9 rounded-full bg-main flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <IoSend className="text-white text-base" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.hwp,.hwpx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                className="hidden"
                onChange={handleDocChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
