'use client'

import  { toast } from "sonner";
import {useEffect} from "react";
import Image from "next/image";

export default function BlockMobile() {
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const apply = () => {
            document.body.style.overflow = mq.matches ? "hidden" : ""
        }

        apply()
        mq.addEventListener("change", apply)

        return() => {
            mq.removeEventListener("change", apply)
            document.body.style.overflow = ""
        }
    }, [])

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            toast.success("링크를 복사했어요.")
        } catch {
            toast.error("링크를 복사하지 못했어요.")
        }
    }

    return(
        <div className="md:hidden fixed inset-0 z-[9999] flex min-w-[320px] flex-col overflow-y-auto bg-white px-6 py-10">
            <img src="/logo.svg" alt="잇다" className="h-7 w-fit bg-black" />

            <div className="flex flex-1 flex-col justify-center">
                <Image src="/monitor.png" alt="" width={213} height={120} className="mb-10 -ml-9 h-auto w-[min(53vw, 213px)]" />

                <h1 className="text-[28px] font-bold leading-none">
                    더 쾌적한 <span className="text-main font-extrabold">PC</span>에서
                    <br />
                    다시 만나요!
                </h1>
            </div>

            <p className="mb-[23px] text-center text-xs leading-normal text-[#b5b5b5]">
                현재 모바일 환경 접속을 지원하지 않고 있습니다.
                <br />
                정상적인 이용을 위해 PC환경에서 다시 접속해주세요.
            </p>

            <button className="h-[52px] w-full rounded-xl bg-main text-[18px] font-semibold text-white active:opacity-80" onClick={copyLink}>
                링크 복사하기
            </button>
        </div>
    )
}