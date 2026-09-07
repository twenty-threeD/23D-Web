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
    const { addToast } = useToast();

    const handleChange = (key: keyof SignUpFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const [showVerification, setShowVerification] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [resending, setResending] = useState(false);

    const isPhoneValid = /^010-\d{4}-\d{4}$/.test(formData.phone);
    const isAllValid =
        isPhoneValid && (!showVerification || formData.phoneVerification.trim() !== "");

    // 서버는 하이픈 유무를 가리지 않지만, 저장 형식을 하나로 맞춘다
    const plainPhone = formData.phone.replace(/-/g, "");

    async function sendCode() {
        // 이미 가입된 번호인지 먼저 확인한 뒤 인증번호를 보낸다
        await checkPhone(formData.phone);
        await sendPhoneVerifyCode(plainPhone);
    }

    async function handleSubmit() {
        if (!isAllValid || isWaiting) return;
        setIsWaiting(true);
        try {
            if (!showVerification) {
                await sendCode();
                setShowVerification(true);
                addToast({ message: "인증번호를 발송했습니다.", type: "success" });
            } else {
                await checkPhoneVerifyCode(plainPhone, formData.phoneVerification.trim());
                addToast({ message: "전화번호 인증이 완료되었습니다.", type: "success" });
                onNext();
            }
        } catch (e) {
            addToast({
                message: e instanceof Error ? e.message : "처리에 실패했습니다.",
                type: "error",
            });
        } finally {
            setIsWaiting(false);
        }
    }

    async function handleResend() {
        if (resending) return;
        setResending(true);
        try {
            await sendPhoneVerifyCode(plainPhone);
            handleChange("phoneVerification", "");
            addToast({ message: "인증번호를 재발송했습니다.", type: "success" });
        } catch (e) {
            addToast({
                message: e instanceof Error ? e.message : "재발송에 실패했습니다.",
                type: "error",
            });
        } finally {
            setResending(false);
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
                onClick={handleSubmit}
                className={`w-75 h-10 mt-12.5 rounded-lg text-lg font-bold transition-colors
                ${isAllValid && !isWaiting
                    ? 'bg-main text-white hover:bg-orange-600 cursor-pointer'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'}`}
            >
                {isWaiting ? "처리 중..." : showVerification ? "인증 확인" : "인증번호 발송"}
            </button>

            {/* 인증번호 재발송 버튼 */}
            {showVerification && (
                <div className="flex items-center justify-center">
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="w-auto h-3 text-xs mt-2.5 font-normal cursor-pointer
                        text-zinc-500 underline underline-offset-2 hover:text-main transition-colors disabled:opacity-50"
                    >
                        {resending ? "재발송 중..." : "인증번호 재발송"}
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
