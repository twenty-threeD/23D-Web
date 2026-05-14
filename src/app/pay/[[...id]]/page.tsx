import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import { Estimate } from "@/src/components/pay/Estimate";

const Page = () => {
    return (
        <div>
            <Header />
            <main className="mb-39.5 mt-7.5 ml-25"> 
                <Estimate imgPath="@/img/pay/tempIMG.svg"/>
            </main>
            <Footer />
        </div>
    );
};

export default Page;