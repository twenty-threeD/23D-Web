"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/src/components/Header"
import Image from "next/image"
import { IoClose, IoSend, IoAdd } from "react-icons/io5"
import Search from "@/src/components/Search"
import { HiDotsHorizontal } from "react-icons/hi"
import { MdOutlineImage, MdOutlineDescription, MdOutlineAssignment, MdOutlineReceiptLong } from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { useChatRoomsStore, type ChatRoom } from "@/src/store/chatRoomsStore"
import { getChatRooms, getChatMessages, deleteChatRoom } from "@/src/lib/chat"
import { toRelativeUrl, uploadFile } from "@/src/lib/file"
import { useHandleError } from "@/src/hooks/useHandleError"
import { useToast } from "@/src/hooks/useToast"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import ContractWizardModal, { type ContractData } from "@/src/components/chat/ContractWizardModal"
import EstimateModal from "@/src/components/chat/EstimateModal"
import { createEstimate, getEstimates, type Estimate as EstimateData } from "@/src/lib/estimate"
import { createContract } from "@/src/lib/contract"
import { getMyProfile } from "@/src/lib/profile"
import { getPost } from "@/src/lib/post"
import { pdfBlobToFile } from "@/src/lib/contractPdf"
import ImageLightbox from "@/src/components/ImageLightbox"

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

type Tab = "all" | "received" | "done"

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
  const myRole = useAuthStore((s) => s.role)
  const selectedId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null

  const [tab, setTab] = useState<Tab>("all")
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [showAttach, setShowAttach] = useState(false)
  const [contractModalState, setContractModalState] = useState<{ mode: "propose" | "review"; initial: Partial<ContractData> } | null>(null)
  const [contractBusy, setContractBusy] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState<boolean | undefined>(undefined)
  const [myMemberId, setMyMemberId] = useState<number | undefined>(undefined)
  const [showEstimate, setShowEstimate] = useState(false)
  const [estimateBusy, setEstimateBusy] = useState(false)
  const [estimates, setEstimates] = useState<EstimateData[]>([])
  const rooms = useChatRoomsStore((s) => s.rooms)
  const setRoomsInStore = useChatRoomsStore((s) => s.setRooms)
  const unreadRoomIds = useChatRoomsStore((s) => s.unreadRoomIds)
  const lastMessageOverride = useChatRoomsStore((s) => s.lastMessageOverride)
  const markRoomRead = useChatRoomsStore((s) => s.markRoomRead)
  const setActiveRoomId = useChatRoomsStore((s) => s.setActiveRoomId)
  const clearPendingGreeting = useChatRoomsStore((s) => s.clearPendingGreeting)
  // post를 올린 사람이 을(파는 사람), 문의하기를 눌러 들어온 사람이 갑(사는 사람)이다.
  // 계정 role이 아니라 방마다 정해지므로 글 작성자를 조회해서 판단한다.
  const [postAuthorUsername, setPostAuthorUsername] = useState<string | null>(null)
  // 글 작성자를 아직 못 불러왔으면 null (판별 전에는 계약서 버튼을 띄우지 않는다).
  const myPartyRole: "client" | "professional" | null =
    postAuthorUsername && myUsername ? (postAuthorUsername === myUsername ? "professional" : "client") : null
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingRooms, setLoadingRooms] = useState(() => !useChatRoomsStore.getState().loaded)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [pendingImageUrls, setPendingImageUrls] = useState<string[]>([])
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([])
  const [pendingDocUrl, setPendingDocUrl] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [pendingDocName, setPendingDocName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const stompClientRef = useRef<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const handleError = useHandleError()
  const { addToast } = useToast()

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

        // 문의하기에서 새로 만들어진 방이면 STOMP 연결 직후 인사말을 한 번 보낸다.
        if (useChatRoomsStore.getState().pendingGreeting[selectedId]) {
          const service = useChatRoomsStore.getState().selectedService[selectedId]
          const greeting = `[채팅 시작]\n${myUsername ?? ""}님이 채팅을 시작했어요\n선택한 서비스: ${service?.planName ?? "기타"}`
          client.publish({
            destination: "/app/chat.send",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ roomId: selectedId, message: greeting, fileUrls: [] }),
          })
          clearPendingGreeting(selectedId)
        }
      },
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
      stompClientRef.current = null
    }
  }, [selectedId, token, myUsername, clearPendingGreeting])

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

  // 받은 견적/보낸 견적/완료된 거래 탭을 postId 기준으로 나누기 위해 내가 관련된 견적서를 전부 가져온다.
  const fetchEstimates = useCallback(async () => {
    if (!token) return
    try {
      const list = await getEstimates(token)
      setEstimates(list)
    } catch {
      setEstimates([])
    }
  }, [token])

  useEffect(() => { fetchRooms() }, [fetchRooms])
  useEffect(() => { fetchMessages() }, [fetchMessages])
  useEffect(() => { fetchEstimates() }, [fetchEstimates])

  // 전화번호 인증 여부(서명 가능 조건)와 내 회원 ID(계약서 등록에 필요)를 함께 받아둔다.
  useEffect(() => {
    if (!token) return
    getMyProfile(token)
      .then((res) => {
        setPhoneVerified(res.data?.phoneVerified ?? false)
        setMyMemberId(res.data?.memberId)
      })
      .catch(() => setPhoneVerified(false))
  }, [token])

  // 이 방의 을(파는 사람)이 누구인지 = 그 글을 쓴 사람이 누구인지 조회한다.
  const selectedPostId = rooms.find((r) => r.roomId === selectedId)?.postId
  useEffect(() => {
    if (!selectedPostId) {
      setPostAuthorUsername(null)
      return
    }
    let cancelled = false
    getPost(selectedPostId, token)
      .then((res) => { if (!cancelled) setPostAuthorUsername(res.data?.member?.username ?? null) })
      .catch(() => { if (!cancelled) setPostAuthorUsername(null) })
    return () => { cancelled = true }
  }, [selectedPostId, token])

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
    { key: "all", label: "전체" },
    { key: "received", label: "받은거래" },
    { key: "done", label: "완료된 거래" },
  ]

  // 채팅방(postId + 상대방)에 딱 맞는 견적서를 찾는다. 견적서는 postId·의뢰인·전문가 조합으로 유일하게 정해진다.
  function estimateForRoom(room: ChatRoom) {
    if (!room.postId || !room.participantId) return undefined
    return estimates.find((e) => {
      if (e.postId !== room.postId) return false
      return myRole === "PROFESSIONAL" ? e.clientId === room.participantId : e.professionalId === room.participantId
    })
  }

  // 결제까지 끝난 견적서만 완료된 거래로, 나머지(견적서를 못 받았거나 아직 결제 전인 것)는 모두 받은거래로 묶는다.
  function roomTab(room: ChatRoom): "received" | "done" {
    return estimateForRoom(room)?.status === "PAID" ? "done" : "received"
  }

  const filteredRooms = rooms.filter(
    (r) => r.participantName.includes(search) && (tab === "all" || roomTab(r) === tab)
  )

  const MAX_CHAT_FILE_SIZE = 25 * 1024 * 1024

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const files = selected.filter((file) => {
      if (file.size > MAX_CHAT_FILE_SIZE) {
        addToast({ message: `${file.name}: 사진은 최대 25MB까지 업로드할 수 있어요.`, type: "error" })
        return false
      }
      return true
    })
    if (!files.length || !token) return
    const previews = files.map((file) => URL.createObjectURL(file))
    setPendingPreviews((prev) => [...prev, ...previews])
    setShowAttach(false)
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const { url } = await uploadFile(token, file)
        uploaded.push(url)
      }
      setPendingImageUrls((prev) => [...prev, ...uploaded])
    } catch {
      previews.forEach((p) => URL.revokeObjectURL(p))
      setPendingPreviews((prev) => prev.filter((p) => !previews.includes(p)))
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function clearPendingImage(index: number) {
    const preview = pendingPreviews[index]
    if (preview) URL.revokeObjectURL(preview)
    setPendingPreviews((prev) => prev.filter((_, i) => i !== index))
    setPendingImageUrls((prev) => prev.filter((_, i) => i !== index))
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
    if (!message.trim() && pendingImageUrls.length === 0 && !pendingDocUrl) return
    const client = stompClientRef.current
    if (!client?.connected || uploading) return

    const fileUrls = pendingImageUrls.length > 0 ? pendingImageUrls : pendingDocUrl ? [pendingDocUrl] : []
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
    pendingPreviews.forEach((p) => URL.revokeObjectURL(p))
    setPendingPreviews([])
    setPendingImageUrls([])
    clearPendingDoc()
  }

  // 견적서는 전문가(을)가 발행한다. 발행 후 채팅방에도 안내 메시지를 남긴다.
  async function handleEstimateSubmit(data: { url: string; totalPay: number }) {
    if (!token || !selectedId || !selectedRoom?.postId) return
    if (!selectedRoom.participantId) {
      addToast({ message: "상대방 정보를 불러오지 못했습니다.", type: "error" })
      return
    }
    setEstimateBusy(true)
    try {
      await createEstimate(token, {
        postId: selectedRoom.postId,
        clientId: selectedRoom.participantId,
        url: data.url,
        totalPay: data.totalPay,
      })

      const client = stompClientRef.current
      if (client?.connected) {
        client.publish({
          destination: "/app/chat.send",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            roomId: selectedId,
            message: `[견적서 발송]\n견적 금액: ${data.totalPay.toLocaleString()}원`,
            fileUrls: [data.url],
          }),
        })
      }
      setShowEstimate(false)
      fetchEstimates()
    } catch (e) {
      handleError(e)
    } finally {
      setEstimateBusy(false)
    }
  }

  // 계약서 진행 순서: 을(글 올린 사람, 파는 쪽)이 [계약서 제안](propose) → 갑(문의한 사람, 사는 쪽)이
  // 검토 후 서명하면 그 자리에서 양쪽 서명이 담긴 PDF를 만들어 서버에 등록([계약서 체결 완료], review)
  // → 갑이 결제.
  //
  // 서명은 PDF 안에 그림으로 이미 들어가므로 서버에 따로 서명하는 단계는 없다
  // (백엔드에서 /api/contract/sign 이 제거됨).
  //
  // 등록하는 사람은 항상 갑이므로 clientId는 내 회원 ID, professionalId는 채팅 상대(을)의 ID다.
  async function handleContractSubmit(data: ContractData, pdfBlob?: Blob) {
    if (!token || !selectedId || !contractModalState || !selectedRoom) return
    const client = stompClientRef.current
    if (!client?.connected) return

    setContractBusy(true)
    try {
      if (contractModalState.mode === "review") {
        if (!pdfBlob) return

        const professionalId = selectedRoom.participantId
        if (!myMemberId || !professionalId) {
          addToast({ message: "계약 당사자 정보를 확인하지 못했습니다.", type: "error" })
          return
        }

        const price = Number(data.price.replace(/[^0-9]/g, "")) || 0
        const pdfFile = pdfBlobToFile(pdfBlob, `contract-${Date.now()}.pdf`)
        const { url: contractUrl } = await uploadFile(token, pdfFile)

        const contract = await createContract(token, {
          contractUrl,
          clientId: myMemberId,
          professionalId,
          price,
        })

        // 결제에 필요한 값(금액·PDF 경로)을 메시지에 같이 실어둔다.
        // 계약서 조회 API는 contractUrl만 돌려주므로 금액은 여기서 보관해야 한다.
        const completed = { contractId: contract.id, price, contractUrl }
        client.publish({
          destination: "/app/chat.send",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            roomId: selectedId,
            message: `[계약서 체결 완료]\n${JSON.stringify(completed)}`,
            fileUrls: [contractUrl],
          }),
        })
        setContractModalState(null)
        return
      }

      const myNewSig = myPartyRole === "client" ? data.clientSig : data.professionalSig
      let myUploadedSig = myNewSig
      if (myNewSig && myNewSig.startsWith("data:")) {
        const file = dataUrlToFile(myNewSig, `contract-signature-${Date.now()}.png`)
        const { url } = await uploadFile(token, file)
        myUploadedSig = url
      }

      const payload: ContractData = {
        ...data,
        clientSig: myPartyRole === "client" ? myUploadedSig : data.clientSig,
        professionalSig: myPartyRole === "professional" ? myUploadedSig : data.professionalSig,
      }

      // 서명 URL은 payload 안에 이미 들어있다. fileUrls로도 보내면 채팅에 서명 이미지가
      // 그대로 첨부되어 보이므로 붙이지 않는다.
      client.publish({
        destination: "/app/chat.send",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: selectedId, message: `[계약서 제안]\n${JSON.stringify(payload)}`, fileUrls: [] }),
      })
      setContractModalState(null)
    } catch (e) {
      handleError(e)
    } finally {
      setContractBusy(false)
    }
  }

  // 계약 체결 후 결제 페이지로 이동한다. 금액·PDF 경로는 체결 메시지에 담겨 있다.
  function handlePayNavigate(completed: CompletedContract) {
    if (!selectedRoom?.postId) return
    const qs = new URLSearchParams()
    qs.set("price", String(completed.price))
    qs.set("contractUrl", completed.contractUrl)
    router.push(`/pay/${selectedRoom.postId}?${qs.toString()}`)
  }

  interface CompletedContract {
    contractId: number
    price: number
    contractUrl: string
  }

  type ContractMessage =
    | { kind: "propose"; data: ContractData }
    | { kind: "completed"; data: CompletedContract }

  function parseContractMessage(text: string): ContractMessage | null {
    const PROPOSE = "[계약서 제안]\n"
    const COMPLETED = "[계약서 체결 완료]\n"

    if (text.startsWith(PROPOSE)) {
      try {
        return { kind: "propose", data: JSON.parse(text.slice(PROPOSE.length)) as ContractData }
      } catch {
        return null
      }
    }

    if (text.startsWith(COMPLETED)) {
      try {
        return { kind: "completed", data: JSON.parse(text.slice(COMPLETED.length)) as CompletedContract }
      } catch {
        return null
      }
    }

    return null
  }

  // 채팅 목록 미리보기. 대괄호 접두사로 주고받는 특수 메시지는 원문 대신 짧은 문구로 보여준다
  // (JSON 본문이 그대로 노출되거나 줄바꿈이 이어붙어 길어지는 걸 막는다).
  function previewOf(text: string) {
    if (!text) return ""
    if (text.startsWith("[계약서 제안]")) return "📄 계약서를 보냈습니다."
    if (text.startsWith("[계약서 체결 완료]")) return "✅ 계약이 체결됐습니다."
    if (text.startsWith("[견적서 발송]")) return "🧾 견적서를 보냈습니다."
    if (text.startsWith("[채팅 시작]")) {
      const service = text.split("\n").find((line) => line.startsWith("선택한 서비스:"))
      return service ?? "채팅을 시작했어요"
    }
    return text.replace(/\n+/g, " ")
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("ko-KR", {
      hour: "2-digit", minute: "2-digit",
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    })
  }

  function dateKey(dateStr: string) {
    return new Date(dateStr).toDateString()
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      {showEstimate && selectedRoom && token && (
        <EstimateModal
          token={token}
          busy={estimateBusy}
          onClose={() => setShowEstimate(false)}
          onSubmit={handleEstimateSubmit}
        />
      )}

      {contractModalState && selectedRoom && myPartyRole && (
        <ContractWizardModal
          myRole={myPartyRole}
          mode={contractModalState.mode}
          initial={contractModalState.initial}
          busy={contractBusy}
          phoneVerified={phoneVerified}
          onClose={() => setContractModalState(null)}
          onSubmit={handleContractSubmit}
        />
      )}

      <div className="flex flex-1 px-20 pt-8 overflow-hidden">
        {/* 왼쪽 채팅 목록 */}
        <div className="flex flex-col w-80 pr-4 shrink-0 border-r border-zinc-200">
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
                const previewText = isUnread
                  ? "새 메시지"
                  : previewOf(lastMessageOverride[room.roomId] ?? room.lastMessagePreview)
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
                    <Image
                      src={room.participantImageUrl ? toRelativeUrl(room.participantImageUrl) : "/profile.png"}
                      alt={room.participantName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded-full"
                    />
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
                  <Image
                    src={selectedRoom.participantImageUrl ? toRelativeUrl(selectedRoom.participantImageUrl) : "/profile.png"}
                    alt={selectedRoom.participantName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
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
                ) : messages.map((msg, idx) => {
                  const prevMsg = messages[idx - 1]
                  const nextMsg = messages[idx + 1]
                  const showDateDivider = !prevMsg || dateKey(msg.createdAt) !== dateKey(prevMsg.createdAt)
                  const showTime =
                    !nextMsg ||
                    nextMsg.senderUsername !== msg.senderUsername ||
                    formatTime(nextMsg.createdAt) !== formatTime(msg.createdAt) ||
                    dateKey(nextMsg.createdAt) !== dateKey(msg.createdAt)

                  const isSent = msg.senderUsername === myUsername
                  const attachedUrls = msg.attachedFileUrls ?? []
                  const imageUrls = attachedUrls.filter(isImageUrl)
                  const docUrls = attachedUrls.filter((url) => !isImageUrl(url))

                  const attachment = attachedUrls.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {imageUrls.map((url) => (
                            <div
                              key={url}
                              className="w-24 h-24 rounded-xl overflow-hidden transition-opacity hover:opacity-90 cursor-pointer"
                              onClick={() => setLightboxSrc(toRelativeUrl(url))}
                            >
                              <img src={toRelativeUrl(url)} alt="첨부 이미지" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      {docUrls.map((url) => (
                        <a
                          key={url}
                          href={toRelativeUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-zinc-100 rounded-xl px-3 py-2 max-w-xs hover:bg-zinc-200"
                        >
                          <MdOutlineDescription className="text-lg text-zinc-500 shrink-0" />
                          <span className="text-xs text-zinc-600 truncate">{fileNameFromUrl(url)}</span>
                        </a>
                      ))}
                    </div>
                  ) : null

                  const contractMsg = parseContractMessage(msg.message)
                  const greetingPrefix = "[채팅 시작]\n"
                  const displayText = contractMsg
                    ? contractMsg.kind === "propose"
                      ? "📄 계약서를 보냈습니다."
                      : "✅ 계약이 체결됐습니다."
                    : msg.message.startsWith(greetingPrefix)
                      ? msg.message.slice(greetingPrefix.length)
                      : msg.message

                  const textBubble = msg.message ? (
                    <div className={`rounded-2xl px-4 py-2 max-w-xs ${isSent ? "bg-main rounded-br-none" : "bg-zinc-100 rounded-bl-none"}`}>
                      <p className={`text-sm whitespace-pre-line ${isSent ? "text-white" : ""}`}>{displayText}</p>
                    </div>
                  ) : null

                  // 계약서는 을(파는 사람)이 갑(사는 사람)에게만 제안하므로, 받은 사람(=갑)만 검토·서명할 수 있다.
                  const contractReviewButton = contractMsg?.kind === "propose" && !isSent ? (
                    <button
                      onClick={() => setContractModalState({ mode: "review", initial: contractMsg.data })}
                      className="px-4 py-2 rounded-xl bg-main text-white text-sm font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
                    >
                      계약서 확인하기
                    </button>
                  ) : null

                  // 계약 체결 메시지는 갑이 서명하면서 보낸 것이므로, 보낸 사람(=갑, 결제하는 쪽)에게 결제 버튼을 보여준다.
                  const payButton = contractMsg?.kind === "completed" && isSent && selectedRoom.postId ? (
                    <button
                      onClick={() => handlePayNavigate(contractMsg.data)}
                      className="px-4 py-2 rounded-xl bg-main text-white text-sm font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
                    >
                      결제하기
                    </button>
                  ) : null

                  return (
                    <div key={msg.messageId}>
                      {showDateDivider && (
                        <div className="flex items-center justify-center py-2">
                          <span className="text-xs text-zinc-400 bg-zinc-100 rounded-full px-3 py-1">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      {!isSent ? (
                        <div className="flex items-end gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                            <Image
                              src={selectedRoom.participantImageUrl ? toRelativeUrl(selectedRoom.participantImageUrl) : "/profile.png"}
                              alt=""
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            {attachment}
                            {textBubble}
                            {contractReviewButton}
                          </div>
                          {showTime && <span className="text-xs text-zinc-400 shrink-0">{formatTime(msg.createdAt)}</span>}
                        </div>
                      ) : (
                        <div className="flex justify-end items-end gap-3">
                          {showTime && <span className="text-xs text-zinc-400">{formatTime(msg.createdAt)}</span>}
                          <div className="flex flex-col gap-1 items-end">
                            {attachment}
                            {textBubble}
                            {payButton}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} alt="첨부 이미지" onClose={() => setLightboxSrc(null)} />
              )}
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
                      className="w-12 h-12 rounded-full bg-main flex items-center justify-center transition-opacity hover:opacity-85 cursor-pointer"
                    >
                      <MdOutlineImage className="text-white text-2xl" />
                    </button>
                    <span className="text-xs text-zinc-500">사진</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => docInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center transition-opacity hover:opacity-85 cursor-pointer"
                    >
                      <MdOutlineDescription className="text-white text-2xl" />
                    </button>
                    <span className="text-xs text-zinc-500">문서</span>
                  </div>
                  {myPartyRole === "professional" && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setShowAttach(false)
                          setContractModalState({
                            mode: "propose",
                            initial: {
                              clientName: selectedRoom.participantName,
                              professionalName: "",
                              // 금액은 계약서를 쓰는 을이 직접 입력한다.
                              // (문의 시 고른 서비스 가격은 갑의 기기에만 남아 있어 여기서는 알 수 없다)
                            },
                          })
                        }}
                        className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center transition-opacity hover:opacity-85 cursor-pointer"
                      >
                        <MdOutlineAssignment className="text-white text-2xl" />
                      </button>
                      <span className="text-xs text-zinc-500">계약서</span>
                    </div>
                  )}
                  {myRole === "PROFESSIONAL" && selectedRoom.postId && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => { setShowAttach(false); setShowEstimate(true) }}
                        className="w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center transition-opacity hover:opacity-85 cursor-pointer"
                      >
                        <MdOutlineReceiptLong className="text-white text-2xl" />
                      </button>
                      <span className="text-xs text-zinc-500">견적서</span>
                    </div>
                  )}
                </div>
              )}

              {pendingPreviews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {pendingPreviews.map((preview, i) => (
                    <div key={preview} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                      <img src={preview} alt="첨부 이미지" className="w-full h-full object-cover" />
                      {uploading && !pendingImageUrls[i] ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs">업로드 중</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => clearPendingImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center transition-colors hover:bg-black/70 cursor-pointer"
                        >
                          <IoClose className="text-white text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
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
                multiple
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
