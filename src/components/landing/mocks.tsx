import { calculatePaymentFee } from "@/src/lib/paymentFee"

// 로그인해야 보이는 화면(채팅·결제·AI 리뷰)은 캡처할 수 없어, 실제 앱 화면의 색·모양을 따라 코드로 그린다.
// 작게 줄여도 글자가 뭉개지지 않고, 예시 숫자를 실제 규칙으로 계산할 수 있다

export function ChatMock() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-zinc-50 p-4 text-sm">
      <div className="flex items-end gap-2">
        <span className="size-7 shrink-0 rounded-full bg-zinc-300" />
        <p className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-ink shadow-sm">
          주방 상부장 교체도 같이 가능할까요?
        </p>
      </div>
      <div className="flex justify-end">
        <p className="max-w-[75%] rounded-2xl rounded-br-sm bg-main px-3.5 py-2 text-white">
          가능합니다. 견적 포함해서 계약서로 보내드릴게요.
        </p>
      </div>
      <div className="flex justify-end">
        <div className="flex w-56 flex-col gap-2 rounded-2xl border border-line bg-white p-3">
          <p className="text-xs font-semibold text-ink-muted">계약서 제안</p>
          <p className="font-bold text-ink">주방 인테리어 시공</p>
          <p className="text-xs text-ink-sub">1,200,000원 · 10.20 – 11.03</p>
          <span className="rounded-lg bg-main py-1.5 text-center text-xs font-semibold text-white">계약서 확인</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 self-center rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
        <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
        영상 통화 중 · 03:12
      </div>
    </div>
  )
}

// 예시 금액도 실제 수수료 규칙으로 계산해, 규칙이 바뀌면 랜딩 숫자도 같이 따라가게 한다
const EXAMPLE_PRICE = 1_200_000

export function PaymentMock() {
  const { fee, settlement } = calculatePaymentFee(EXAMPLE_PRICE)
  const won = (value: number) => `${value.toLocaleString("ko-KR")}원`
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-zinc-50 p-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">결제 내역</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">결제 완료</span>
      </div>
      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between"><dt className="text-ink-muted">결제 금액</dt><dd className="font-semibold text-ink">{won(EXAMPLE_PRICE)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">수수료</dt><dd className="text-ink-sub">{won(fee)}</dd></div>
        <div className="flex justify-between border-t border-line pt-1.5"><dt className="text-ink-muted">정산 예정</dt><dd className="font-bold text-main">{won(settlement)}</dd></div>
      </dl>
    </div>
  )
}

export function ReviewMock() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-zinc-50 p-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-main/10 px-2 py-0.5 text-xs font-bold text-main">AI 요약</span>
        <span className="font-semibold text-ink">★ 4.9</span>
      </div>
      <p className="leading-relaxed text-ink-sub">마감 일정을 잘 지키고, 작업 중간마다 사진으로 진행 상황을 공유해 줘요.</p>
      <div className="flex flex-wrap gap-1.5">
        {["#일정 준수", "#꼼꼼해요", "#소통 빨라요"].map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink-sub">{tag}</span>
        ))}
      </div>
    </div>
  )
}

export function VerifyMock() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-night p-4 font-mono text-xs text-white/70 md:p-5 md:text-sm">
      <div className="flex items-center justify-between font-sans">
        <span className="font-semibold text-white">거래 기록 검증</span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-300" />
          원장과 일치
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="flex justify-between gap-4"><span className="text-white/40">order</span><span className="truncate">order-20261020-k3x9</span></p>
        <p className="flex justify-between gap-4"><span className="text-white/40">block</span><span>#1,026</span></p>
        <p className="flex justify-between gap-4"><span className="text-white/40">hash</span><span className="truncate text-main">0x8f3a91c4e07b…74d8a2c</span></p>
      </div>
    </div>
  )
}
