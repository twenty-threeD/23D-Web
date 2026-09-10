"use client"
import SearchInput from "@/src/components/blockchain/SearchInput";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {display} from "@/src/lib/display";
import {formatAmount, getTxVerification, type TxVerification} from "@/src/lib/TxVerify";
import {toRelativeUrl} from "@/src/lib/file";
import {useAuthStore} from "@/src/store/authStore";
import {LuBadgeCheck, LuBadgeX, LuChevronLeft, LuCopy} from "react-icons/lu";

/** 개요 화면 경로. 뒤로가기와 검색이 모두 이 경로를 기준으로 움직인다. */
const VERIFY_PATH = "/blockchain/verify"

/** 값 옆의 복사 버튼. 클립보드를 못 쓰는 환경에서는 조용히 넘어간다. */
function CopyButton({value, label}: {value: string; label: string}) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
        } catch {
            // 복사에 실패해도 값은 화면에 그대로 있으므로 알리지 않는다
        }
    }

    return (
        <button type="button" onClick={handleCopy} aria-label={`${label} 복사`} className="shrink-0">
            <LuCopy className="size-3 text-[#aaa]"/>
        </button>
    )
}

/** 트랜잭션 정보 카드의 한 줄. 값이 없으면 '-' 를 보여주고 복사 버튼은 감춘다. */
function Field({label, value, copyable = false}: {label: string; value: string | null; copyable?: boolean}) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-[#aaa]">{label}</p>
            <div className="flex items-center gap-[6px]">
                {/* 해시처럼 긴 값은 줄바꿈 대신 말줄임으로 한 줄을 지킨다. 전체 값은 복사 버튼으로 가져간다. */}
                <p title={value ?? undefined} className="truncate text-base font-medium text-black">{display(value)}</p>
                {copyable && value && <CopyButton value={value} label={label}/>}
            </div>
        </div>
    )
}

/** 계약서 주소는 값 그대로 보여주되 눌러서 열 수 있게 한다. */
function LinkField({label, url}: {label: string; url: string}) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-[#aaa]">{label}</p>
            <a
                href={toRelativeUrl(url)}
                target="_blank"
                rel="noreferrer"
                title={url}
                className="truncate text-base font-medium text-black hover:text-main"
            >
                {url}
            </a>
        </div>
    )
}

/** 체인에 기록이 남아 있는지 보여주는 배지. */
function LedgerBadge({matched}: {matched: boolean}) {
    const color = matched ? "text-main border-main" : "text-[#aaa] border-[#aaa]"
    const dot = matched ? "bg-main" : "bg-[#aaa]"

    return (
        <span className={`flex h-6 items-center gap-[6px] rounded-xl border px-[9px] text-xs font-semibold ${color}`}>
            <span className={`size-1 rounded-[2px] ${dot}`}/>
            {matched ? "기록됨" : "기록없음"}
        </span>
    )
}

export default function Page() {
    const params = useParams<{id: string}>()
    const router = useRouter()
    // 토큰을 함께 보내야 서버가 당사자로 보고 계약 상세를 내려준다
    const token = useAuthStore((state) => state.accessToken)
    const txHash = decodeURIComponent(params.id)

    const [verification, setVerification] = useState<TxVerification | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        setVerification(null)
        setError(null)

        getTxVerification(txHash, token)
            .then((result) => {
                if (!cancelled) { setVerification(result) }
            })
            .catch((cause: Error) => {
                if (!cancelled) { setError(cause.message) }
            })

        return () => { cancelled = true }
    }, [txHash, token])

    const detail = verification?.detail ?? null

    const handleSearch = (input: string) => {
        router.push(`${VERIFY_PATH}/detail/${encodeURIComponent(input)}`)
    }

    return (
        <div className="bg-white">
            {/* 시안대로 헤더에서 64px 아래에 검색창을 둔다. */}
            <main className="mx-auto flex w-full max-w-[1312px] flex-col gap-12 px-6 pb-28 pt-16">
                <div className="mx-auto w-full max-w-[1000px]">
                    <SearchInput onSearch={handleSearch}/>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        type="button"
                        onClick={() => router.push(VERIFY_PATH)}
                        className="flex w-fit cursor-pointer items-center gap-1 pl-[10px] text-base font-medium text-[#aaa] hover:text-main"
                    >
                        <LuChevronLeft className="size-4"/>
                        뒤로가기
                    </button>

                    <div className="flex flex-col gap-12 rounded-xl bg-[#fbfbfb] p-12">
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-medium text-black">트랜잭션 정보</p>
                            {verification && <LedgerBadge matched={verification.ledgerMatched}/>}
                        </div>

                        {error
                            ? <p className="text-base font-medium text-[#aaa]">{error}</p>
                            : (
                                <div className="flex flex-col gap-4">
                                    <Field label="해시(hash)" value={verification?.txHash ?? txHash} copyable/>
                                    <Field
                                        label="높이(height)"
                                        value={verification?.height !== null && verification?.height !== undefined
                                            ? String(verification.height)
                                            : null}
                                        copyable
                                    />
                                    <Field label="주문번호(orderId)" value={verification?.orderId ?? null} copyable/>
                                    <Field label="결제액" value={formatAmount(verification?.amount ?? null)}/>
                                    <Field label="결제 일시" value={verification?.paidAt ?? null}/>
                                    {/* 결제 당사자에게만 계약 상세가 내려온다 */}
                                    {detail && (
                                        <>
                                            <Field label="판매자 성명" value={detail.sellerName}/>
                                            <Field label="구매자 성명" value={detail.buyerName}/>
                                            <LinkField label="계약서 주소" url={detail.contractUrl}/>
                                        </>
                                    )}
                                </div>
                            )}
                    </div>

                    <div className="flex flex-col gap-[30px] rounded-xl bg-[#fbfbfb] p-12">
                        <p className="text-2xl font-medium text-black">트랜잭션 검증여부</p>
                        <div className="flex items-start gap-2">
                            {verification === null
                                ? <p className="text-xl font-medium text-[#aaa]">{error ?? "조회 중"}</p>
                                : verification.verified
                                    ? (
                                        <>
                                            <LuBadgeCheck className="size-5 shrink-0 text-main"/>
                                            <p className="text-xl font-medium text-main">검증됨</p>
                                        </>
                                    )
                                    : (
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-xs font-medium leading-normal text-[#AAA]">
                                                {display(verification.reason)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <LuBadgeX className="size-5 shrink-0 text-[#FB1C1C]"/>
                                                <p className="text-xl font-medium text-[#FB1C1C]">
                                                    {display(verification.reasonMessage ?? "검증되지 않음")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
