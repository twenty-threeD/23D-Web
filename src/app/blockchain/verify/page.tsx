"use client"
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import SearchInput from "@/src/components/blockchain/SearchInput";
import {useEffect, useState} from "react";
import type {ReactNode} from "react";
import {subscribeBlockHeight} from "@/src/lib/BlockHeight";
import {formatBlockTime, subscribeNetworkInfo, type NetworkInfo} from "@/src/lib/NetworkInfo";
import {
    subscribeRecentActivity,
    truncateAddress,
    truncateHash,
    truncatePaymentId,
    type RecentActivity,
} from "@/src/lib/RecentActivity";
import {formatAbsoluteTime, formatRelativeTime, useNow} from "@/src/lib/RelativeTime";
import BlockHeightCounter from "@/src/components/blockchain/BlockHeightCounter";
import {LuBlocks, LuNetwork} from "react-icons/lu";
import {TbCashBanknotePlus} from "react-icons/tb";

function CardTitle({
    icon,
    children,
    link,
}: {
    icon: ReactNode
    children: ReactNode
    link?: string
}) {
    return (
        <div className="flex h-6 items-center gap-3">
            {icon}
            <p className="text-xl font-medium text-black">{children}</p>
            {link && <span className="text-xs font-medium text-[#aaa] underline">{link}</span>}
        </div>
    )
}

/**
 * 카드 제목 아이콘은 시안과 같은 24px, 같은 색으로 맞춘다.
 * react-icons는 stroke가 currentColor라 색은 클래스로 준다.
 */
const CARD_ICON = {className: "size-6 shrink-0 text-main"}

const EMPTY = "-"

function display(value: string | number | null | undefined) {
    return value === null || value === undefined || value === "" ? EMPTY : String(value)
}

function Stat({label, value}: {label: string; value: string | number | null}) {
    return (
        <div className="flex flex-col gap-3">
            <p className="whitespace-nowrap text-base font-medium text-[#aaa]">{label}</p>
            <p className="whitespace-nowrap text-2xl font-semibold text-main">{display(value)}</p>
        </div>
    )
}

type Cells = [ReactNode, ReactNode, ReactNode]

function TableRow({cells, header = false}: {cells: Cells; header?: boolean}) {
    return (
        <div className={`grid grid-cols-3 gap-[22px] ${header ? "text-sm text-[#aaa]" : "text-black"}`}>
            <span className={header ? "" : "text-base"}>{cells[0]}</span>
            <span className={`text-right ${header ? "" : "text-sm"}`}>{cells[1]}</span>
            <span className={`text-right ${header ? "" : "text-sm"}`}>{cells[2]}</span>
        </div>
    )
}

/** 카드마다 보여줄 행 수. 데이터가 모자라면 '-' 행으로 채워 카드 높이를 고정한다. */
const ROW_LIMIT = 5

/**
 * 조회 전이거나 결과가 모자랄 때 남는 자리를 빈 행으로 채운다.
 * 폴링 결과가 도착할 때마다 카드 높이가 튀는 것을 막는다.
 */
function padRows(rows: Cells[]): Cells[] {
    const empty: Cells = [EMPTY, EMPTY, EMPTY]
    return [...rows, ...Array<Cells>(Math.max(0, ROW_LIMIT - rows.length)).fill(empty)]
}

/** 기록된 시각을 "1일 전"으로 보여주고, 마우스를 올리면 정확한 시각을 보여준다. */
function RelativeTime({iso, now}: {iso: string; now: number | null}) {
    if (now === null) { return <>{EMPTY}</> }

    return (
        <time dateTime={iso} title={formatAbsoluteTime(iso)}>
            {display(formatRelativeTime(iso, now))}
        </time>
    )
}

export default function Page() {
    const [blockHeight, setBlockHeight] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
    const [activity, setActivity] = useState<RecentActivity | null>(null)

    useEffect(() => {
        const unsubscribe = subscribeBlockHeight({
            onHeight: (height) => {
                setBlockHeight(height)
                setError(null)
                setIsLoading(false)
            },
            onError: (message) => {
                setError(message)
                setIsLoading(false)
            },
        })

        return unsubscribe
    }, [])

    useEffect(() => {
        const unsubscribe = subscribeNetworkInfo({
            onInfo: setNetworkInfo,
            onError: () => setNetworkInfo(null),
        })

        return unsubscribe
    }, [])

    useEffect(() => {
        const unsubscribe = subscribeRecentActivity({
            onActivity: setActivity,
            onError: () => setActivity(null),
        })

        return unsubscribe
    }, [])

    const blocks = (activity?.blocks ?? []).slice(0, ROW_LIMIT)
    const transactions = (activity?.transactions ?? []).slice(0, ROW_LIMIT)

    // 두 카드가 같은 시각을 공유해 타이머 하나로 모든 행이 함께 갱신된다
    const now = useNow(blocks.map((block) => block.time))

    const handleSearch = (search: string) => {}

    return (
        <div className="bg-white">
            <Header/>
            <main className="mx-auto flex w-full max-w-[1312px] flex-col px-6 pb-28 pt-24 lg:pt-40">
                <h1 className="text-center text-4xl leading-normal text-black">
                    <span className="font-bold text-main">블록체인</span>
                    <span className="font-medium">에 기록된</span>
                    <br/>
                    <span className="font-medium">결제기록을 확인해보세요</span>
                </h1>

                <div className="mx-auto mt-12 w-full max-w-[1000px]">
                    <SearchInput onSearch={handleSearch}/>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                    <div className="min-h-[188px] rounded-xl bg-[#fbfbfb] p-7">
                        <div className="flex flex-col gap-9">
                            <CardTitle icon={<LuBlocks {...CARD_ICON}/>}>블록 높이</CardTitle>
                            <BlockHeightCounter
                                value={blockHeight !== null && !error && !isLoading ? blockHeight : null}
                            />
                        </div>
                    </div>

                    <div className="min-h-[188px] rounded-xl bg-[#fbfbfb] p-7">
                        <div className="flex flex-col gap-[34px]">
                            <CardTitle icon={<LuNetwork {...CARD_ICON}/>}>네트워크 정보</CardTitle>
                            <div className="flex items-start gap-9">
                                <Stat label="운용 노드" value={networkInfo?.nodes ?? null}/>
                                <Stat label="트랜잭션 검증자" value={networkInfo?.validators ?? null}/>
                                <Stat
                                    label="평균 블록 생성 시간"
                                    value={formatBlockTime(networkInfo?.avgBlockTimeSec ?? null)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#fbfbfb] p-7 font-medium">
                        <CardTitle icon={<LuBlocks {...CARD_ICON}/>} link="자세히보기">최근 블록</CardTitle>
                        <div className="mt-7 flex flex-col gap-4">
                            <TableRow header cells={["블록높이", "시간", "TX 수"]}/>
                            {padRows(blocks.map((block): Cells => [
                                String(block.height),
                                <RelativeTime key={block.height} iso={block.time} now={now}/>,
                                `${block.txCount} tx`,
                            ])).map((cells, index) => (
                                <TableRow key={blocks[index]?.height ?? `empty-${index}`} cells={cells}/>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#fbfbfb] p-7 font-medium">
                        <CardTitle icon={<TbCashBanknotePlus {...CARD_ICON}/>} link="자세히보기">최근 트랜잭션</CardTitle>
                        <div className="mt-7 flex flex-col gap-4">
                            <TableRow header cells={["트랜잭션 해시", "서명자", "결제 ID"]}/>
                            {padRows(transactions.map((transaction): Cells => [
                                display(truncateHash(transaction.hash)),
                                display(truncateAddress(transaction.signer)),
                                display(truncatePaymentId(transaction.paymentId)),
                            ])).map((cells, index) => (
                                <TableRow key={transactions[index]?.hash ?? `empty-${index}`} cells={cells}/>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <Footer/>
        </div>
    )
}
