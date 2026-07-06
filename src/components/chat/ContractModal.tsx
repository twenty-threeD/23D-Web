"use client"

import { useState } from "react"
import { IoClose } from "react-icons/io5"
import SignaturePad from "./SignaturePad"

interface ContractParty {
  name: string
  items: { label: string; value: string }[]
}

interface ContractModalProps {
  roomId: number
  client: ContractParty
  professional: ContractParty
  contractContent: string
  date: string
  myRole: "client" | "professional"
  onClose: () => void
  onSubmit: (data: { clientSig: string; professionalSig: string; clientName: string; professionalName: string }) => void
}

export default function ContractModal({
  client,
  professional,
  contractContent,
  date,
  myRole,
  onClose,
  onSubmit,
}: ContractModalProps) {
  const [clientSig, setClientSig] = useState("")
  const [professionalSig, setProfessionalSig] = useState("")
  const [clientName, setClientName] = useState(client.name)
  const [professionalName, setProfessionalName] = useState(professional.name)

  const canSubmit = clientSig && professionalSig && clientName.trim() && professionalName.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 sticky top-0 bg-white z-10">
          <span className="text-lg font-bold">용역 계약서</span>
          <button onClick={onClose} className="cursor-pointer text-zinc-400 hover:text-zinc-700">
            <IoClose className="text-2xl" />
          </button>
        </div>

        <div className="px-8 py-8 flex flex-col gap-8">
          {/* 전문 */}
          <p className="text-sm text-zinc-700 leading-relaxed">
            <strong>갑 {clientName || "___"}</strong>과(와) <strong>을 {professionalName || "___"}</strong>은(는) 아래 용역에 관하여
            다음과 같이 계약을 체결하고, 신의와 성실을 바탕으로 이를 성실히 이행할 것을 약정한다.
          </p>

          {/* 계약 내용 */}
          <div className="flex flex-col gap-4">
            {[
              { title: "제 1 조 (용역의 내용)", body: contractContent || "본 계약의 용역 내용이 이 영역에 출력됩니다. 줄바꿈은 그대로 보존됩니다." },
              { title: "제 2 조 (이행 및 검수)", body: "을은 선량한 관리자의 주의로 본 용역을 수행하며, 갑은 을의 업무 수행에 필요한 자료·정보를 적시에 제공한다. 산출물에 대한 검수는 인도 후 5영업일 이내에 서면 또는 전자적 방법으로 통지한다." },
              { title: "제 3 조 (비밀유지)", body: "갑과 을은 본 계약의 이행과 관련하여 알게 된 상대방의 영업비밀 및 업무상 비밀을 계약 종료 후에도 제3자에게 누설하지 아니한다." },
              { title: "제 4 조 (분쟁 해결)", body: "본 계약과 관련하여 분쟁이 발생한 경우, 양 당사자는 우선 상호 협의로 해결하며, 협의가 이루어지지 아니할 때에는 서울중앙지방법원을 제1심 관할 법원으로 한다." },
              { title: "제 5 조 (계약의 효력)", body: "본 계약은 양 당사자가 서명 또는 기명날인한 날부터 효력을 발생하며, 본 계약서는 2부 작성하여 갑과 을이 각 1부씩 보관한다." },
            ].map((article) => (
              <div key={article.title} className="flex flex-col gap-1">
                <span className="font-bold text-sm">{article.title}</span>
                <p className="text-sm text-zinc-600 leading-relaxed pl-4">{article.body}</p>
              </div>
            ))}
          </div>

          {/* 날짜 */}
          <p className="text-center text-sm font-medium">{date}</p>

          {/* 당사자 정보 + 서명 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 갑 */}
            <div className="flex flex-col gap-4 border-t-2 border-zinc-800 pt-4">
              <span className="font-bold">갑 (의뢰인)</span>
              <div className="flex flex-col gap-1">
                {client.items.map((item) => (
                  <div key={item.label} className="flex gap-2 text-sm">
                    <span className="text-zinc-500 w-16 shrink-0">{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
              {myRole === "client" ? (
                <SignaturePad label="갑" onSave={setClientSig} savedUrl={clientSig} />
              ) : (
                <div className="border border-zinc-300 rounded-lg h-32 flex items-center justify-center bg-zinc-50">
                  {clientSig
                    ? <img src={clientSig} alt="갑 서명" className="h-full object-contain" />
                    : <span className="text-xs text-zinc-400">서명 대기 중</span>
                  }
                </div>
              )}
              <div className="flex items-center gap-2 border-t border-zinc-300 pt-2">
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="갑 이름 입력"
                  className="flex-1 text-sm border-b border-zinc-300 focus:outline-none focus:border-zinc-600 bg-transparent"
                />
                <span className="text-xs text-zinc-400 shrink-0">(서명)</span>
              </div>
            </div>

            {/* 을 */}
            <div className="flex flex-col gap-4 border-t-2 border-zinc-800 pt-4">
              <span className="font-bold">을 (수행자)</span>
              <div className="flex flex-col gap-1">
                {professional.items.map((item) => (
                  <div key={item.label} className="flex gap-2 text-sm">
                    <span className="text-zinc-500 w-16 shrink-0">{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
              {myRole === "professional" ? (
                <SignaturePad label="을" onSave={setProfessionalSig} savedUrl={professionalSig} />
              ) : (
                <div className="border border-zinc-300 rounded-lg h-32 flex items-center justify-center bg-zinc-50">
                  {professionalSig
                    ? <img src={professionalSig} alt="을 서명" className="h-full object-contain" />
                    : <span className="text-xs text-zinc-400">서명 대기 중</span>
                  }
                </div>
              )}
              <div className="flex items-center gap-2 border-t border-zinc-300 pt-2">
                <input
                  value={professionalName}
                  onChange={(e) => setProfessionalName(e.target.value)}
                  placeholder="을 이름 입력"
                  className="flex-1 text-sm border-b border-zinc-300 focus:outline-none focus:border-zinc-600 bg-transparent"
                />
                <span className="text-xs text-zinc-400 shrink-0">(서명)</span>
              </div>
            </div>
          </div>

          {/* 제출 */}
          <button
            disabled={!canSubmit}
            onClick={() => onSubmit({ clientSig, professionalSig, clientName, professionalName })}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity ${
              canSubmit ? "bg-main cursor-pointer" : "bg-zinc-300 cursor-not-allowed"
            }`}
          >
            계약서 제출
          </button>
        </div>
      </div>
    </div>
  )
}
