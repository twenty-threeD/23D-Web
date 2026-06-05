'use client';

import { useState } from "react";
import { InputField } from "@/src/components/InputField";

import { SignUpFormData } from "@/type/authData";
import { sendVerifyCode, checkVerifyCode } from '@/src/lib/auth'

interface InputEmailProps {
    formData: SignUpFormData;
    setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>;
    onNext: () => void;
}

const InputEmail = ({ formData, setFormData, onNext }: InputEmailProps) => {
    const handleChange = (key: keyof SignUpFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const isAllValid = 
        formData.email.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email); 

    const [showVerification, setShowVerification] = useState(false);

    // 인증코드 발송
    const handleSendCode = async () => {
        await sendVerifyCode(formData.email)
        setShowVerification(true)
    }

    // 인증코드 확인
    const handleVerify = async () => {
        try {
            await checkVerifyCode(formData.email, formData.emailVerification)
            onNext()
        } catch (e) {
            alert("인증번호가 일치하지 않습니다.")
        }
    }

    return (
        <div className="mt-5">
            <InputField label="이메일 입력" placeholder="이메일을 입력해주세요" 
            isEssential={true} value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />

            {showVerification && (
                <InputField 
                    label="인증번호 입력" 
                    placeholder="인증번호를 입력해주세요" 
                    value={formData.emailVerification} 
                    onChange={(e) => handleChange("emailVerification", e.target.value)} 
                />
            )}

            <button 
                disabled={!isAllValid}
                onClick={() => {
                    if (!showVerification) {
                        handleSendCode();
                    } else {
                        handleVerify();
                    }
                }}
                className={`w-75 h-10 mt-10 rounded-lg text-lg font-bold transition-colors 
                ${isAllValid
                    ? 'bg-main text-white hover:bg-main/90' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
                <span>{showVerification ? "다음" : "인증번호 발송"}</span>
            </button>
            
            {/* 인증번호 재발송 버튼 */}
            {showVerification && (
                <div className="flex items-center justify-center">
                    <button
                        onClick={() => { handleSendCode(); alert("인증번호가 재발송되었습니다."); }}
                        className="w-auto h-3 text-xs mt-2.5 font-normal
                        text-gray-500 hover:text-main transition-colors"
                    >
                        인증번호 재발송
                    </button>
                </div>
                
            )}
        </div>
    );
};

export default InputEmail;