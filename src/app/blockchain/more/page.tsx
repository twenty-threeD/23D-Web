"use client"
import {Suspense, useEffect, useState} from "react";
import type {ReactNode} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import {LuChevronLeft} from "react-icons/lu";
import {
    subscribeRecentActivity,
    truncateAddress,
    truncatePaymentId,
    type RecentActivity,
} from "@/src/lib/RecentActivity";
import {formatAbsoluteTime, formatRelativeTime, useNow} from "@/src/lib/RelativeTime";
import {display, EMPTY} from "@/src/lib/display";
import CommunityPagination from "@/src/components/CommunityPagination";

/** 개요 화면 경로. 뒤로가기는 히스토리 대신 이 경로로 보내 직접 진입해도 갈 곳이 있게 한다. */
const VERIFY_PATH = "/blockchain/verify"

/** 한 페이지에 보여줄 행 수 */
const PAGE_SIZE = 10

type Cells = [ReactNode, ReactNode, ReactNode]

/**
 * 개요 카드의 표와 같은 3열 구성을 넓은 폭으로 펼친다. 시안의 행 간격(24px)을 따른다.
 * 트랜잭션 해시는 64자 전체를 보여주므로 첫 열을 넓혀 한 줄에 들어가게 한다.
 */
function TableRow({cells, header = false, wideFirst = false}: {cells: Cells; header?: boolean; wideFirst?: boolean}) {
    const columns = wideFirst ? "grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-3"

    return (
        <div className={`grid ${columns} gap-[22px] ${header ? "text-sm text-[#aaa]" : "text-black"}`}>
            <span className={`truncate ${header ? "" : "text-base"}`}>{cells[0]}</span>
            <span className={`truncate text-right ${header ? "" : "text-sm"}`}>{cells[1]}</span>
            <span className={`truncate text-right ${header ? "" : "text-sm"}`}>{cells[2]}</span>
        </div>
    )
}

function RelativeTime({iso, now}: {iso: string; now: number | null}) {
    if (now === null) { return <>{EMPTY}</> }

    return (
        <time dateTime={iso} title={formatAbsoluteTime(iso)}>
            {display(formatRelativeTime(iso, now))}
        </time>
    )
}

function MoreContent() {
    const router = useRouter()
    // 시안은 '최근 블록'만 있지만, 트랜잭션도 같은 틀로 보여주려고 쿼리로 구분한다
    const searchParams = useSearchParams()
    const isTransactions = searchParams.get("type") === "transactions"
    // 페이지는 주소(?page=)에 둬 새로고침·뒤로가기에도 보던 페이지가 유지되게 한다
    const requestedPage = Math.max(1, Number(searchParams.get("page")) || 1)
    // 블록을 눌러 들어오면 그 높이의 트랜잭션만 보여준다
    const heightParam = searchParams.get("height")
    const blockHeight = isTransactions && heightParam !== null && Number.isFinite(Number(heightParam))
        ? Number(heightParam)
        : null
    const [activity, setActivity] = useState<RecentActivity | null>(null)

    useEffect(() => {
        const unsubscribe = subscribeRecentActivity({
            onActivity: setActivity,
            onError: () => setActivity(null),
        })

        return unsubscribe
    }, [])

    const blocks = activity?.blocks ?? []
    // 노드가 블록별 조회를 따로 주지 않아, 이미 받아온 최근 트랜잭션에서 높이로 거른다
    const transactions = (activity?.transactions ?? [])
        .filter((transaction) => blockHeight === null || transaction.height === blockHeight)
    const now = useNow(blocks.map((block) => block.time))

    const header: Cells = isTransactions
        ? ["트랜잭션 해시", "서명자", "결제 ID"]
        : ["블록높이", "시간", "TX 수"]

    const rows: {key: string; cells: Cells}[] = isTransactions
        ? transactions.map((transaction) => ({
            key: transaction.hash,
            cells: [
                <Link
                    key={transaction.hash}
                    href={`${VERIFY_PATH}/detail/${encodeURIComponent(transaction.hash)}`}
                    title={transaction.hash}
                    className="hover:text-main hover:underline"
                >
                    {transaction.hash}
                </Link>,
                display(truncateAddress(transaction.signer)),
                display(truncatePaymentId(transaction.paymentId)),
            ],
        }))
        : blocks.map((block) => ({
            key: String(block.height),
            cells: [
                <Link
                    key={block.height}
                    href={`/blockchain/more?type=transactions&height=${block.height}`}
                    className="hover:text-main hover:underline"
                >
                    {block.height}
                </Link>,
                <RelativeTime key={block.height} iso={block.time} now={now}/>,
                `${block.txCount} tx`,
            ],
        }))

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
    // 폴링 사이에 기록 수가 줄어도 빈 페이지가 보이지 않게 마지막 페이지로 붙인다
    const page = Math.min(requestedPage, totalPages)
    const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const hrefFor = (target: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", String(target))
        return `/blockchain/more?${params.toString()}`
    }

    return (
        <div className="flex flex-col gap-9">
            <button
                type="button"
                onClick={() => router.push(blockHeight !== null ? "/blockchain/more" : VERIFY_PATH)}
                className="flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-[#838383] hover:text-main"
            >
                <LuChevronLeft className="size-6"/>
                뒤로가기
            </button>

            <div className="flex flex-col gap-4">
                <h1 className="text-xl font-medium text-black">
                    {blockHeight !== null
                        ? `블록 ${blockHeight}에 포함된 트랜잭션`
                        : isTransactions ? "최근 트랜잭션" : "최근 블록"}
                </h1>

                <div className="flex flex-col gap-6 rounded-xl bg-[#fbfbfb] p-7 font-medium">
                    <TableRow header cells={header} wideFirst={isTransactions}/>
                    {activity === null ? (
                        <p className="py-6 text-center text-sm text-[#aaa]">불러오는 중이에요</p>
                    ) : rows.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[#aaa]">
                            {blockHeight !== null ? "최근 기록에서 이 블록의 트랜잭션을 찾을 수 없어요" : "아직 기록이 없어요"}
                        </p>
                    ) : (
                        pageRows.map((row) => <TableRow key={row.key} cells={row.cells} wideFirst={isTransactions}/>)
                    )}
                </div>

                <CommunityPagination page={page} totalPages={totalPages} hrefFor={hrefFor}/>
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <div className="flex justify-center bg-white">
            <main className="flex w-full max-w-[1312px] flex-col px-6 pb-12 pt-12">
                {/* useSearchParams는 정적 렌더 시 Suspense 경계가 없으면 빌드가 실패한다 */}
                <Suspense>
                    <MoreContent/>
                </Suspense>
            </main>
        </div>
    )
}
