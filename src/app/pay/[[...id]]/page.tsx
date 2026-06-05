"use client";
import { useState } from "react";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import { Estimate } from "@/src/components/pay/Estimate";
import { FinalBill } from "@/src/components/pay/FinalBill";
import { ApplyPay } from "@/src/components/pay/ApplyPay";
import { OnClickPay } from "@/src/components/pay/OnClickPay";

import PriceCard from "@/src/components/PriceCard"; 

const Page = () => {
    const [isAgree, setIsAgree] = useState(false);

    return (
        <div>
            <Header />
            <main className="flex flex-col gap-4 justify-center py-8 px-20">
                <div className="w-full">
                    <h1 className="text-[24px] font-bold">견적서 확인</h1>
                </div>
                <div className="flex items-start gap-10 justify-between">
                    <Estimate 
                        imgPath="/pay/tempIMG.svg" 
                        title="오늘의 연애상담" 
                        avgRating={4.5} 
                        reviewCount={20} 

                        serviceCategory="연애상담"
                        expertName="안재민"
                        deliveryTime="7일 이내"
                    />

                    <div className="pr-25">
                        <FinalBill
                            defaultAmount={1000}
                            additionalAmount={500}
                            travelCost={200}
                            pointUsage={100}
                        />
                    </div>
                </div>


                <div className="flex items-start gap-10 justify-between">
                    <PriceCard />

                    <div className="pr-25">
                        <ApplyPay isAgree={isAgree} setIsAgree={setIsAgree} />
                        <OnClickPay isAgree={isAgree} price={1000} orderName="오늘의 연애상담" orderCustomerName="안재민" />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Page;