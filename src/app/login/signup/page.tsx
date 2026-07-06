'use client';
import { useState } from "react";
import Image from "next/image";
import { useToast } from "@/src/hooks/useToast";
import { useRouter } from "next/navigation";
import TermsAgreement from "@/src/components/login/TermsAgreement";
import InputData from "@/src/components/login/inputData";
import InputEmail from "@/src/components/login/InputEmail";
import InputPhone from "@/src/components/login/InputPhone";
import Link from "next/link";

import { signup } from '@/src/lib/auth'
import BackButton from "@/src/components/BackButton";


export default function Page() {
    const { addToast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isWaiting, setIsWaiting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        emailVerification: "",
        password: "",
        passwordConfirm: "",
        phone: "",
        phoneVerification: ""
    });

    const getHeight = () => {
        switch (step) {
            case 1: return "515px"; 
            case 2: return "621px";
            case 3: return "521px";
            case 4: return "518px";
            case 5: return "380px";
            default: return "515px";
        }
    };

    const handleNextStep = () => {
        setStep((prev) => prev + 1);
    };

    const handleSignup = async () => {
        setIsWaiting(true)
        try {
            await signup(formData.name, formData.username, formData.email, formData.password, formData.phone)
            addToast(
                { message: "회원가입에 성공했습니다. 로그인 페이지로 이동합니다.", type: "success" }
            )
            router.push('/login/signin')
        } catch (e) {
            addToast(
                { message: e instanceof Error ? `회원가입에 실패하였습니다. ${e.message}` : '회원가입에 실패했습니다.', type: "error" },
            );
        } finally {
            setIsWaiting(false)
        }
    }

    return (
        <div className="flex justify-center items-center bg-zinc-100 h-full">
            <div className="flex fixed left-4 top-4 px-4 py-4">
                <BackButton />
            </div>
            <main 
                style={{ height: getHeight() }}
                className={`
                    w-106 py-16 rounded-3xl border border-zinc-300 bg-white 
                    flex flex-col items-center justify-center
                    transition-[height] duration-500 ease-in-out overflow-hidden
                `}
            >
                <Link href="/main">
                    <Image src="/icon.png" alt="Logo" width={80} height={40} className="mb-5" />
                </Link>
                <div className="w-full flex flex-col gap-3 items-center transition-opacity duration-300">
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
                            <InputPhone formData={formData} setFormData={setFormData} onNext={handleNextStep} />
                        </>
                    )}
                    {step === 5 && (
                        <>
                            <h1 className="font-bold text-lg">{formData.name}님, 이제 
                                <span className="text-[#FF884D]"> 사람과 사람을 이으러 </span> 
                                가볼까요?</h1>
                            <button
                                disabled={isWaiting}
                                onClick={handleSignup}
                                className={`w-75 h-10 mt-12.5 rounded-lg text-lg font-bold transition-colors
                                ${isWaiting ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' : 'bg-main text-white hover:bg-main/90'}`}
                            >
                                {isWaiting ? "처리 중..." : "시작하기"}
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};