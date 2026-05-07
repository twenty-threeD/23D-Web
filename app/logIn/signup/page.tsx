'use client';
import { useState } from "react";

import Image from "next/image";

import LogoImg from "@/src/img/Logo.svg";

import { CheckBox } from "@/components/logIn/checkBox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Page = () => {
    const [terms, setTerms] = useState({
        service: false,
        privacy: false,
        thirdParty: false,
        location: false,
    });

    const handleAllAgree = () => {
        const isAllChecked = Object.values(terms).every((value) => value);
        const newValue = !isAllChecked;
        setTerms({
            service: newValue,
            privacy: newValue,
            thirdParty: newValue,
            location: newValue,
        });
    };

    const handleCheck = (key: keyof typeof terms) => {
        setTerms((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isEssentialAgreed = terms.service && terms.privacy && terms.thirdParty;

    return (
        <div className = "bg-[#F4F4F4] ">
            <Header />
            <div className="w-106 h-128.75 m-auto rounded-3xl border border-[#D9D9D9] bg-white
            mb-28.75 mt-28.75 flex flex-col items-center justify-center">
                <Image src={LogoImg} alt="Logo" width={80} height={40} className="mb-5" />
                <h1 className="font-bold text-[18px]">잠깐, 이용하기 전에 동의가 필요해요</h1>

                <div className="w-full ml-30 mt-5 flex flex-col">
                    <label className="text-[12px] text-[#2F303F] ml-4.75 flex items-center cursor-pointer font-bold">
                        <input 
                        type="checkbox" 
                        checked={Object.values(terms).every((v) => v)}
                        onChange={handleAllAgree}
                        className="mr-2 
                        accent-[#FE6A4C] w-3 h-3" />
                        전체 동의하기
                    </label>

                    <div className="w-62.5 h-px bg-[#D9D9D9] mt-2 mb-2 ml-4.75"></div>

                    <CheckBox isEssential={true} label="'잇다' 서비스 이용약관" link="/terms/service" checked={terms.service} onChange={() => handleCheck('service')} />
                    <CheckBox isEssential={true} label="개인정보 수집 및 이용 동의" link="/terms/privacy" checked={terms.privacy} onChange={() => handleCheck('privacy')} />
                    <CheckBox isEssential={true} label="제 3자 개인정보 수집 이용 동의" link="/terms/third-party" checked={terms.thirdParty} onChange={() => handleCheck('thirdParty')} />

                    <div className="w-62.5 h-px bg-[#D9D9D9] mt-2 mb-2 ml-4.75"></div>

                    <CheckBox isEssential={false} label="위치기반 서비스 이용약관" link="/terms/location" checked={terms.location} onChange={() => handleCheck('location')} />

                    <button disabled={!isEssentialAgreed} className={`w-75 h-10 mt-12.5  text-white rounded-lg text-lg font-bold transition-colors
                    ${isEssentialAgreed ? 'bg-[#FE6A4C] hover:bg-[#FE6A4C]/90' : 'bg-gray-400 cursor-not-allowed'}`}>
                        다음
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    )
};

export default Page;