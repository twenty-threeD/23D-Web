'use client';

import { useState } from "react";
import { InputField } from "@/src/components/InputField";

import { SignUpFormData } from "@/type/authData";


interface InputPhoneProps {
    formData: SignUpFormData;
    setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>;
    onNext: () => void;
}

const InputPhone = ({ formData, setFormData, onNext }: InputPhoneProps) => {
    const handleChange = (key: keyof SignUpFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const [showVerification, setShowVerification] = useState(false);

    const isAllValid = 
        formData.phone.trim() !== "" &&
        /^010\d{8}$/.test(formData.phone) &&
        (!showVerification || formData.phoneVerification.trim() !== "");

    const VerificationCode = "123456"; // 실제로는 서버에서 받아와야 함. 임시

    return (
        <div className="mt-5">
            <InputField label="전화번호 입력" placeholder="전화번호를 입력해주세요" 
            isEssential={true} value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />

            {showVerification && (
                <InputField 
                    label="인증번호 입력" 
                    placeholder="인증번호를 입력해주세요" 
                    value={formData.phoneVerification} 
                    onChange={(e) => handleChange("phoneVerification", e.target.value)} 
                />
            )}

            <button 
                disabled={!isAllValid}
                onClick={() => {
                    if (!showVerification) {
                        setShowVerification(true);
                    } else {
                        if (formData.phoneVerification === VerificationCode) {
                            onNext();
                        } else {
                            alert("인증번호가 일치하지 않습니다.");
                        }
                    }
                }}
                className={`w-75 h-10 mt-12.5 rounded-lg text-lg font-bold transition-colors 
                ${isAllValid
                    ? 'bg-[#FE6A4C] text-white hover:bg-[#FE6A4C]/90' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
                <span>{showVerification ? "다음" : "인증번호 발송"}</span>
            </button>
            
            {/* 인증번호 재발송 버튼 */}
            {showVerification && (
                <div className="flex items-center justify-center">
                    <button
                        onClick={() => { alert("인증번호가 재발송되었습니다."); }}
                        className="w-auto h-3 text-xs mt-2.5 font-normal
                        text-gray-500 hover:text-[#FE6A4C] transition-colors"
                    >
                        인증번호 재발송
                    </button>
                </div>
            )}

            <div className="flex items-center justify-center">
                <button
                    onClick={() => { onNext(); }}
                    className="w-auto h-3 text-xs mt-2.5 font-normal
                    text-gray-500 hover:text-[#FE6A4C] transition-colors"
                >
                    나중에 하기
                </button>
            </div>
        </div>
    );
};

export default InputPhone;