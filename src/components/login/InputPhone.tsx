'use client';

import { useState } from "react";
import { InputField } from "@/src/components/InputField";

import { SignUpFormData } from "@/type/authData";
import { checkPhone } from "@/src/lib/member";
import { sendPhoneVerifyCode, checkPhoneVerifyCode } from "@/src/lib/auth";
import { useToast } from "@/src/hooks/useToast";

interface InputPhoneProps {
    formData: SignUpFormData;
    setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>;
    onNext: () => void;
}

function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const InputPhone = ({ formData, setFormData, onNext }: InputPhoneProps) => {
    const { addToast } = useToast()
    const handleChange = (key: keyof SignUpFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const [showVerification, setShowVerification] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);

    const isAllValid =
        formData.phone.trim() !== "" &&
        /^010-\d{4}-\d{4}$/.test(formData.phone) &&
        (!showVerification || formData.phoneVerification.trim() !== "");

    const handleSendCode = async () => {
        setIsWaiting(true)
        try {
            await checkPhone(formData.phone)
            await sendPhoneVerifyCode(formData.phone)
            setShowVerification(true)
            addToast({ message: "인증번호가 발송되었습니다.", type: "success" })
        } catch (e) {
            addToast({ message: e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.", type: "error" })
        } finally {
            setIsWaiting(false)
        }
    }

    const handleVerify = async () => {
        setIsWaiting(true)
        try {
            await checkPhoneVerifyCode(formData.phone, formData.phoneVerification)
            onNext()
        } catch {
            addToast({ message: "인증번호가 일치하지 않습니다.", type: "error" })
        } finally {
            setIsWaiting(false)
        }
    }

    return (
        <div className="mt-5">
            <InputField label="전화번호 입력" placeholder="전화번호를 입력해주세요"
            isEssential={true} value={formData.phone} onChange={(e) => handleChange("phone", formatPhone(e.target.value))} />

            {showVerification && (
                <InputField 
                    label="인증번호 입력" 
                    placeholder="인증번호를 입력해주세요" 
                    value={formData.phoneVerification} 
                    onChange={(e) => handleChange("phoneVerification", e.target.value)} 
                />
            )}

            <button
                disabled={!isAllValid || isWaiting}
                onClick={() => { showVerification ? handleVerify() : handleSendCode() }}
                className={`w-75 h-10 mt-12.5 rounded-lg text-lg font-bold transition-colors
                ${isAllValid && !isWaiting
                    ? 'bg-main text-white hover:bg-main/90'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'}`}
            >
                {isWaiting ? "처리 중..." : showVerification ? "다음" : "인증번호 발송"}
            </button>

            {/* 인증번호 재발송 버튼 */}
            {showVerification && (
                <div className="flex items-center justify-center">
                    <button
                        onClick={handleSendCode}
                        className="w-auto h-3 text-xs mt-2.5 font-normal cursor-pointer
                        text-zinc-500 underline underline-offset-2 hover:text-main transition-colors"
                    >
                        인증번호 재발송
                    </button>
                </div>
            )}

            <div className="flex items-center justify-center">
                <button
                    onClick={() => { onNext(); }}
                    className="w-auto h-3 text-xs mt-2.5 font-normal cursor-pointer
                    text-zinc-500 underline underline-offset-2 hover:text-main transition-colors"
                >
                    나중에 하기
                </button>
            </div>
        </div>
    );
};

export default InputPhone;