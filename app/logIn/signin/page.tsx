'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import LogoImg from "@/src/img/Logo.svg";
import GoogleIMG from "@/src/img/logIn/Google.svg";
import KakaoTalkIMG from "@/src/img/logIn/kakaoTalk.svg";
import NaverIMG from "@/src/img/logIn/naver.svg";

import { InputField } from "@/components/inputField";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Page = () => {
    // 1. 입력값 상태 관리
    const [formData, setFormData] = useState({
        id: "",
        password: "",
    });

    const handleChange = (key: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const canLogin = formData.id.trim() !== "" && formData.password.trim() !== "";

    const handleLogin = () => {
        if (!canLogin) return;
        console.log("로그인 시도:", formData);
        // 여기에 로그인 API 호출 로직 추가
    };

    return (
        <div className="bg-zinc-100 min-h-screen">
            <Header />
            <div className="w-200 h-150 m-auto rounded-3xl flex items-start mt-18.25 mb-18.25 shadow-lg">
                <div className="w-100 h-150 bg-linear-to-tr from-rose-500 to-indigo-500 rounded-l-3xl flex items-center justify-center"></div>
                <div className="w-100 h-150 bg-white rounded-r-3xl flex flex-col items-center justify-center">                    
                    <Image src={LogoImg} alt="Logo" width={80} height={40} className="mb-15.25" />

                    {/* 인풋 필드 영역 */}
                    <div className="mb-2.5">
                        <InputField 
                            label="아이디 입력" 
                            placeholder="아이디를 입력해주세요" 
                            isEssential={true} 
                            value={formData.id}
                            onChange={(e) => handleChange("id", e.target.value)}
                        />
                        <InputField 
                            label="비밀번호 입력" 
                            placeholder="비밀번호를 입력해주세요" 
                            type="password" 
                            showIcon={true} 
                            isEssential={true} 
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                        />
                    </div>

                    {/* 로그인 버튼: 조건에 따라 스타일과 활성화 상태 변경 */}
                    <button 
                        onClick={handleLogin}
                        disabled={!canLogin}
                        className={`w-75 h-10 rounded-lg text-lg font-bold transition-colors 
                        ${canLogin 
                            ? 'bg-[#FE6A4C] text-white hover:bg-[#FE6A4C]/90' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        로그인
                    </button>

                    <div className="flex justify-between w-75 mt-2.5">
                        <Link href="#" className="text-[10px] text-gray-500 underline">
                            비밀번호를 잊으셨나요?
                        </Link>
                        <div className="flex gap-1 text-[10px] text-gray-500">
                            <span>계정이 없으신가요?</span>
                            <Link href="/login/signup" className="underline">
                                회원가입
                            </Link>
                        </div>
                    </div>

                    {/* 소셜 로그인 */}
                    <div className="flex gap-4 mt-5">
                        {[
                            { src: GoogleIMG, alt: "Google" },
                            { src: KakaoTalkIMG, alt: "KakaoTalk" },
                            { src: NaverIMG, alt: "Naver" }
                        ].map((social, index) => (
                            <button key={index} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-300 hover:border-[#FE6A4C] transition-colors">
                                <Image src={social.src} alt={social.alt} width={20} height={20} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Page;