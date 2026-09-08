"use client"
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import SearchInput from "@/src/components/blockchain/SearchInput";

interface BlockHeight {
    blockHeight: number
}

export default function Page() {
    const handleSearch = (search: string) => {}

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header/>
            <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-6 pb-24 pt-20 sm:pt-28 lg:pt-40">
                <section className="mt-[clamp(80px, 12vw, 160px)]">
                    <h1 className="text-center text-4xl font-semibold leading-tight tracking-tight text-black sm:text-5xl">
                        <span className="font-bold text-main">블록체인</span>에 기록된
                        <br/>
                        결제기록을 확인해보세요.
                    </h1>

                    <div className="mx-auto mt-12 w-full max-w-250">
                        <SearchInput onSearch={handleSearch}/>
                    </div>
                </section>
            </main>
            <Footer/>
        </div>
    )
}