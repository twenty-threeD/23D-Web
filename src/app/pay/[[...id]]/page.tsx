import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import Image from "next/image";


const Page = () => {
    return (
        <div>
            <Header />
            <main className="pb-39.5 pt-7.5 pl-25">
                <h1 className="text-[24px] font-bold">견적서 확인</h1>
                <div className="w-235.5 h-59.5 border border-gray-300">
                    <Image src="/pay/tempIMG.svg" alt="" width={100} height={100} />
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default Page;