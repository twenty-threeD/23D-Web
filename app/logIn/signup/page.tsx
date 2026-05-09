'use client';
import { useState } from "react";

import Image from "next/image";
import LogoImg from "@/src/img/Logo.svg";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import TermsAgreement from "@/components/login/TermsAgreement";
import InputData from "@/components/login/InputData";
import InputEmail from "@/components/login/InputEmail";

const Page = () => {
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: "",
        id: "",
        password: "",
        passwordConfirm: "",
        email: "",
        emailVerification: ""
    });

    const getHeight = () => {
        switch (step) {
            case 1: return "515px"; 
            case 2: return "621px";
            case 3: return "521px";
            case 4: return "518px";
            default: return "515px";
        }
    };

    const handleNextStep = () => {
        setStep((prev) => prev + 1);
    };

    return (
        <div className="bg-gray-100">
            <Header />
            
            <main 
                style={{ height: getHeight() }}
                className={`
                    w-106 m-auto rounded-3xl border border-gray-300 bg-white 
                    mb-28.75 mt-28.75 flex flex-col items-center justify-center
                    transition-[height] duration-500 ease-in-out overflow-hidden
                `}
            >
                <Image src={LogoImg} alt="Logo" width={80} height={40} className="mb-5" />
                
                <div className="w-full flex flex-col items-center transition-opacity duration-300">
                    {step === 1 && (
                        <>
                            <h1 className="font-bold text-lg">잠깐, 이용하기 전에 동의가 필요해요</h1>
                            <TermsAgreement onNext={handleNextStep} />
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <h1 className="font-bold text-lg">회원가입 절차를 시작할게요</h1>
                            <InputData formData={formData} setFormData={setFormData} onNext={handleNextStep} />
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <h1 className="font-bold text-lg">시작하기전, <span className="text-[#FF884D]">이메일 인증</span>이 필요해요</h1>
                            <InputEmail formData={formData} setFormData={setFormData} onNext={handleNextStep} />
                        </>
                    )}
                    {step === 4 && (
                        <>
                            <h1 className="font-bold text-lg">사람들과 <span className="text-[#FF884D]">채팅을 하기 위해서</span>는</h1>
                            <h1 className="font-bold text-lg"> <span className="text-[#FF884D]">전화번호</span>가 필요해요</h1>
                            
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Page;