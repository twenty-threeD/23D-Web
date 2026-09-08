"use client"
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import SearchInput from "@/src/components/blockchain/SearchInput";
import {useEffect, useState} from "react";
import type {ReactNode} from "react";
import {getLatestBlockHeight} from "@/src/lib/BlockHeight";

function CardTitle({
    icon,
    children,
    link,
}: {
    icon: string
    children: ReactNode
    link?: string
}) {
    return (
        <div className="flex h-6 items-center gap-3">
            <img src={icon} alt="" className="size-6 shrink-0"/>
            <p className="text-xl font-medium text-black">{children}</p>
            {link && <span className="text-xs font-medium text-[#aaa] underline">{link}</span>}
        </div>
    )
}

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

type Cells = [string | null, string | null, string | null]

function TableRow({cells, header = false}: {cells: Cells; header?: boolean}) {
    return (
        <div className={`grid grid-cols-3 gap-[22px] ${header ? "text-sm text-[#aaa]" : "text-black"}`}>
            <span className={header ? "" : "text-base"}>{display(cells[0])}</span>
            <span className={`text-right ${header ? "" : "text-sm"}`}>{display(cells[1])}</span>
            <span className={`text-right ${header ? "" : "text-sm"}`}>{display(cells[2])}</span>
        </div>
    )
}

export default function Page() {
    const [blockHeight, setBlockHeight] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchBlockHeight = async () => {
            try {
                const result = await getLatestBlockHeight()

                if (isMounted) {
                    setBlockHeight(result.blockHeight)
                    setError(null)
                }
            } catch {
                if (isMounted) {
                    setError("-")
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchBlockHeight()

        const intervalId = window.setInterval(fetchBlockHeight, 5000)

        return () => {
            isMounted = false
            window.clearInterval(intervalId)
        }
    }, [])

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
                            <CardTitle icon="/icons/blockchain/blocks.svg">블록 높이</CardTitle>
                            <p className="text-4xl font-medium text-main">
                                {display(
                                    blockHeight !== null && !error && !isLoading
                                        ? blockHeight.toLocaleString()
                                        : null
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="min-h-[188px] rounded-xl bg-[#fbfbfb] p-7">
                        <div className="flex flex-col gap-[34px]">
                            <CardTitle icon="/icons/blockchain/network.svg">네트워크 정보</CardTitle>
                            <div className="flex items-start gap-9">
                                <Stat label="운용 노드" value={null}/>
                                <Stat label="트랜잭션 검증자" value={null}/>
                                <Stat label="평균 블록 생성 시간" value={null}/>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#fbfbfb] p-7 font-medium">
                        <CardTitle icon="/icons/blockchain/blocks.svg" link="자세히보기">최근 블록</CardTitle>
                        <div className="mt-7 flex flex-col gap-4">
                            <TableRow header cells={["블록높이", "시간", "TX 수"]}/>
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#fbfbfb] p-7 font-medium">
                        <CardTitle icon="/icons/blockchain/banknote-arrow-up.svg" link="자세히보기">최근 트랜잭션</CardTitle>
                        <div className="mt-7 flex flex-col gap-4">
                            <TableRow header cells={["트랜잭션 해시", "서명자", "결제 ID"]}/>
                        </div>
                    </div>
                </div>
            </main>
            <Footer/>
        </div>
    )
}
