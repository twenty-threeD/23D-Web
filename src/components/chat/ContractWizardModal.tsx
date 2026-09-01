"use client"

import { useState } from "react"
import { IoCheckmark } from "react-icons/io5"
import SignaturePad from "./SignaturePad"
import { buildContractPdf } from "@/src/lib/contractPdf"
import Modal from "@/src/components/ui/Modal"
import Button from "@/src/components/ui/Button"
import { inputClass, inputShellClass } from "@/src/components/ui/Field"

export interface ContractData {
  clientName: string
  professionalName: string
  startDate: string
  endDate: string
  inspectionDays: string
  serviceContent: string
  price: string
  clientSig: string
  professionalSig: string
}

interface ContractWizardModalProps {
  myRole: "client" | "professional"
  // propose: 을(파는 사람)이 처음 작성해서 갑에게 보낼 때.
  // review: 갑(사는 사람)이 받은 제안을 검토하고 서명할 때 — 이 시점에 양쪽 서명이 다 모이므로,
  // 제출과 동시에 계약서 전체를 PDF로 캡처해서 서버에 등록한다.
  mode: "propose" | "review"
  initial: Partial<ContractData>
  busy?: boolean
  // 전화번호 인증 여부. 인증 안 된 사람은 서명할 수 없다.
  phoneVerified?: boolean
  onClose: () => void
  // review 모드에서는 계약서 전체를 캡처한 PDF Blob도 함께 넘어온다.
  onSubmit: (data: ContractData, pdfBlob?: Blob) => void
}

function formatDate(value: string) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function formatPrice(value: string) {
  const digits = value.replace(/[^0-9]/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString()
}

// 이름 마지막 글자의 받침 유무에 따라 조사를 고른다 (완성형 한글 범위 밖이면 받침 없는 쪽으로 처리).
function josa(word: string, withBatchim: string, withoutBatchim: string): string {
  const trimmed = word.trim()
  if (!trimmed) return withoutBatchim
  const lastChar = trimmed.charCodeAt(trimmed.length - 1)
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return withoutBatchim
  return (lastChar - 0xac00) % 28 !== 0 ? withBatchim : withoutBatchim
}

export default function ContractWizardModal({ myRole, mode, initial, busy, phoneVerified, onClose, onSubmit }: ContractWizardModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [clientName, setClientName] = useState(initial.clientName ?? "")
  const [professionalName, setProfessionalName] = useState(initial.professionalName ?? "")
  const [startDate, setStartDate] = useState(initial.startDate ?? "")
  const [endDate, setEndDate] = useState(initial.endDate ?? "")
  const [inspectionDays, setInspectionDays] = useState(initial.inspectionDays ?? "")
  const [serviceContent, setServiceContent] = useState(initial.serviceContent ?? "")
  const [price, setPrice] = useState(initial.price ?? "")
  const [clientSig, setClientSig] = useState(initial.clientSig ?? "")
  const [professionalSig, setProfessionalSig] = useState(initial.professionalSig ?? "")
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const termsEditable = mode === "propose"
  const canEditClientName = myRole === "client"
  const canEditProfessionalName = myRole === "professional"
  const isReview = mode === "review"
  const verified = phoneVerified !== false

  const step1Valid =
    clientName.trim() !== "" &&
    professionalName.trim() !== "" &&
    (!termsEditable ||
      (startDate !== "" &&
        endDate !== "" &&
        inspectionDays.trim() !== "" &&
        serviceContent.trim() !== "" &&
        Number(price.replace(/[^0-9]/g, "")) > 0))

  const mySig = myRole === "client" ? clientSig : professionalSig
  // review는 갑이 마지막으로 서명하는 단계라, 제출하려면 양쪽 서명이 다 있어야 한다(=바로 서버에 등록되므로).
  const canSubmit = (isReview ? clientSig !== "" && professionalSig !== "" : mySig !== "") && verified

  function collectData(): ContractData {
    return { clientName, professionalName, startDate, endDate, inspectionDays, serviceContent, price, clientSig, professionalSig }
  }

  async function handleSubmit() {
    const data = collectData()
    if (!isReview) {
      onSubmit(data)
      return
    }
    if (generatingPdf) return
    setGeneratingPdf(true)
    try {
      // 화면을 캡처하지 않고 계약 내용을 그대로 텍스트 PDF로 만든다.
      const blob = await buildContractPdf(data)
      onSubmit(data, blob)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const articles = [
    { title: "제 1 조 (용역의 내용)", body: serviceContent || "본 계약에서 수행하고자 하는 용역의 내용을 명시한다." },
    {
      title: "제 2 조 (용역의 기간)",
      body: `본 용역의 수행 기간은 ${formatDate(startDate)} 부터 ${formatDate(endDate)} 까지로 하며, 부득이한 사유로 기간을 변경하게 되는 경우 서면으로 합의한다.`,
    },
    {
      title: "제 3 조 (대금 및 지급)",
      body: `1. 계약의 총액은 금 ${formatPrice(price)}원으로 하며, 갑이 을에게 지급한다.\n2. 갑은 용역 이행에 대한 검수 후 영업일 기준 3일 이내에 을에게 대금을 지급한다.`,
    },
    {
      title: "제 4 조 (계약 이행 및 검수)",
      body: `1. 을은 용역 제공자로서 제 1조에 명시되어 있는 용역의 내용을 성실히 수행할 의무를 가진다.\n2. 갑은 을이 수행한 용역의 결과에 대해 ${inspectionDays || " "}일 이내에 검수 결과를 서면 혹은 전자적 방법으로 통지해야하며, 통지하지 않는 경우 용역 결과를 수용한다는 의미로 간주하고 계약을 종료한다.`,
    },
    { title: "제 5 조 (비밀유지)", body: "갑과 을 양측은 본 계약을 수행하며 알게된 상대방의 영업비밀 및 영업상의 비밀을 계약을 체결한 이후로 제 3자에게 누설해서는 안된다." },
    { title: "제 6 조 (계약해지)", body: "갑 또는 을이 본 계약의 내용을 위반하고 이에 대해 상당한 기간을 정하여 시정을 요구했음에도 불구하고 당사자가 시정하지 않는 경우 서면 또는 전자적 방법으로 계약해지를 통지할 수 있다." },
    { title: "제 7 조 (분쟁 해결)", body: "본 계약과 관련하여 분쟁이 발생하는 경우, 상호 협의로 해결을 우선시 하며 협의가 이루어지지 아니한 경우 서울중앙지방법원을 제1심 관할 법원으로 한다." },
    { title: "제 8 조 (지식재산권 이전)", body: "본 용역의 수행 과정에서 발생한 결과물에 대한 저작권 등 지식재산권은 갑의 검수 후 즉시 갑에게 귀속된다." },
    { title: "제 9 조 (계약의 효력)", body: "1. 본 계약은 양 당사자가 서명 또는 기명날인한 날부터 효력을 발생하며, 본 계약서는 갑과 을, 용역 중개 서비스에서 전자적 방법 등으로 보관한다.\n2. 제 5조(비밀유지)에 한해서 계약이 종료된 이후에도 유효하다." },
  ]

  const showSignatures = step === 2

  return (
    <Modal
      title={`계약서 ${mode === "propose" ? "작성" : "검토 및 서명"}`}
      width="lg"
      closeOnBackdrop={false}
      bare
      onClose={onClose}
    >
          {/* 계약서 미리보기 */}
          <div className="flex-1 overflow-y-auto px-10 py-8 border-r border-zinc-200 bg-zinc-50/60">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-zinc-100 px-10 py-10 flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-contract text-center tracking-widest">용 역 계 약 서</h1>
            <p className="text-sm text-zinc-700 leading-relaxed">
              <strong className="text-contract">{clientName || " "}</strong>{josa(clientName, "과", "와")}(이하 &apos;갑&apos;이라 한다){" "}
              <strong className="text-contract">{professionalName || " "}</strong>{josa(professionalName, "은", "는")}(이하 &apos;을&apos;이라 한다) 아래 용역에 관하여 다음과 같이 계약을 체결한다.
            </p>
            <div className="flex flex-col gap-3">
              {articles.map((article) => (
                <div key={article.title} className="flex flex-col gap-1">
                  <span className="font-bold text-contract text-xs">{article.title}</span>
                  <p className="text-xs text-zinc-800 leading-relaxed whitespace-pre-line">{article.body}</p>
                </div>
              ))}
            </div>

            {showSignatures && (
              <>
                <h2 className="text-base font-bold text-center text-contract tracking-widest">
                  {startDate ? formatDate(startDate) : " "}
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 border-t-2 border-contract pt-4">
                    <span className="font-semibold text-sm text-contract">갑 (의뢰인)</span>
                    <span className="text-xs text-zinc-500">성명(기업명) {clientName}</span>
                    {clientSig ? (
                      <img src={clientSig} alt="갑 서명" className="h-24 object-contain border border-zinc-200 rounded-lg bg-white" />
                    ) : (
                      <div className="h-24 border border-dashed border-zinc-200 rounded-lg bg-zinc-50 flex items-center justify-center text-xs text-zinc-400">서명 대기 중</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 border-t-2 border-contract pt-4">
                    <span className="font-semibold text-sm text-contract">을 (수행자)</span>
                    <span className="text-xs text-zinc-500">성명(기업명) {professionalName}</span>
                    {professionalSig ? (
                      <img src={professionalSig} alt="을 서명" className="h-24 object-contain border border-zinc-200 rounded-lg bg-white" />
                    ) : (
                      <div className="h-24 border border-dashed border-zinc-200 rounded-lg bg-zinc-50 flex items-center justify-center text-xs text-zinc-400">서명 대기 중</div>
                    )}
                  </div>
                </div>
              </>
            )}
            </div>
          </div>

          {/* 입력 패널 */}
          <div className="w-80 shrink-0 overflow-y-auto px-6 py-8 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 1 ? "bg-main text-white shadow-sm shadow-main/30" : "bg-zinc-100 text-zinc-400"}`}>
                {step === 2 ? <IoCheckmark className="text-sm" /> : 1}
              </span>
              <span className={`transition-colors ${step === 1 ? "text-main font-semibold" : "text-zinc-400"}`}>기본 정보 입력</span>
              <div className={`flex-1 h-px transition-colors ${step === 2 ? "bg-main" : "bg-zinc-200"}`} />
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 2 ? "bg-main text-white shadow-sm shadow-main/30" : "bg-zinc-100 text-zinc-400"}`}>2</span>
              <span className={`transition-colors ${step === 2 ? "text-main font-semibold" : "text-zinc-400"}`}>서명</span>
            </div>

            {step === 1 ? (
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  갑 성명
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={!canEditClientName}
                    placeholder="갑 성명"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  을 성명
                  <input
                    value={professionalName}
                    onChange={(e) => setProfessionalName(e.target.value)}
                    disabled={!canEditProfessionalName}
                    placeholder="을 성명"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  계약 시작일
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!termsEditable}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  계약 종료일
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!termsEditable}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  검수 일수
                  <div className={inputShellClass}>
                    <input
                      type="number"
                      min={0}
                      value={inspectionDays}
                      onChange={(e) => setInspectionDays(e.target.value)}
                      disabled={!termsEditable}
                      placeholder="검수 일수"
                      className="flex-1 text-sm focus:outline-none disabled:bg-transparent disabled:text-zinc-500"
                    />
                    <span className="text-sm text-zinc-400">일</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  계약 금액
                  <div className={inputShellClass}>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={!termsEditable}
                      placeholder="계약 금액"
                      className="flex-1 text-sm focus:outline-none disabled:bg-transparent disabled:text-zinc-500"
                    />
                    <span className="text-sm text-zinc-400">원</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  1조 내용 (용역 내용)
                  <textarea
                    value={serviceContent}
                    onChange={(e) => setServiceContent(e.target.value)}
                    disabled={!termsEditable}
                    rows={3}
                    placeholder="어떤 용역을 수행하는지 적어주세요"
                    className={`${inputClass} resize-none`}
                  />
                </label>

                <Button size="lg" disabled={!step1Valid} onClick={() => setStep(2)}>
                  다음
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {!verified ? (
                  <div className="flex flex-col gap-2 border border-dashed border-zinc-300 rounded-lg px-4 py-5 text-center">
                    <p className="text-sm text-zinc-600">전화번호 인증을 완료해야 서명할 수 있어요.</p>
                    <a href="/profile" className="text-xs text-main underline">
                      프로필에서 인증하기
                    </a>
                  </div>
                ) : myRole === "client" ? (
                  <SignaturePad label="갑" onSave={setClientSig} savedUrl={clientSig} />
                ) : (
                  <SignaturePad label="을" onSave={setProfessionalSig} savedUrl={professionalSig} />
                )}

                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 underline cursor-pointer text-left transition-colors"
                >
                  이전으로
                </button>

                <Button size="lg" disabled={!canSubmit || busy || generatingPdf} onClick={handleSubmit}>
                  {generatingPdf ? "PDF 생성 중..." : busy ? (isReview ? "등록 중..." : "전송 중...") : mode === "propose" ? "제안하기" : "서명하고 계약서 등록"}
                </Button>
              </div>
            )}
          </div>
    </Modal>
  )
}
