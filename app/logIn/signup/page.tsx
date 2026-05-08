'use client';
import { useState } from "react";

import Image from "next/image";
import LogoImg from "@/src/img/Logo.svg";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import TermsAgreement from "@/components/logIn/termsAgreement";
import InputData from "@/components/logIn/inputData";

const Page = () => {
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: "",
        id: "",
        password: "",
        passwordConfirm: "",
    });

    const getHeight = () => {
        switch (step) {
            case 1: return "515px"; 
            case 2: return "621px";
            case 3: return "400px";
            default: return "515px";
        }
    };

    const handleNextStep = () => {
        setStep((prev) => prev + 1);
    };

    return (
        <div className="bg-[#F4F4F4]">
            <Header />
            
            <main 
                style={{ height: getHeight() }}
                className={`
                    w-106 m-auto rounded-3xl border border-[#D9D9D9] bg-white 
                    mb-28.75 mt-28.75 flex flex-col items-center justify-center
                    transition-[height] duration-500 ease-in-out overflow-hidden
                `}
            >
                <Image src={LogoImg} alt="Logo" width={80} height={40} className="mb-5" />
                
                <div className="w-full flex flex-col items-center transition-opacity duration-300">
                    {step === 1 && (
                        <>
                            <h1 className="font-bold text-[18px]">잠깐, 이용하기 전에 동의가 필요해요</h1>
                            <TermsAgreement onNext={handleNextStep} />
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <h1 className="font-bold text-[18px]">회원가입 절차를 시작할게요</h1>
                            <InputData formData={formData} setFormData={setFormData} />
                        </>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default Page;