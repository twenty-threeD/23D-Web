import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { Estimate } from "@/components/pay/Estimate";

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