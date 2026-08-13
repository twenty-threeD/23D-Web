'use client';

import { useState } from "react";
import { InputField } from "@/src/components/InputField";
import { SignUpFormData } from "@/type/authData";
import { checkUsername } from "@/src/lib/member";

interface InputDataProps {
    formData: SignUpFormData;
    setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>;
    onNext: () => void;
}

const InputData = ({ formData, setFormData, onNext }: InputDataProps) => {
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    const handleChange = (key: keyof SignUpFormData, value: string) => {
        if (key === "username") setUsernameError(null);
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleNext = async () => {
        if (!isAllValid || checking) return;
        setChecking(true);
        try {
            await checkUsername(formData.username);
            onNext();
        } catch (e) {
            setUsernameError(e instanceof Error ? e.message : "아이디 확인에 실패했습니다.");
        } finally {
            setChecking(false);
        }
    };

    // 1. 비밀번호 유효성 검사 로직 수정
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,32}$/;
    
    // 비밀번호가 입력되었는데, 정규식을 통과하지 못했을 때 (에러 메시지용)
    const isInvalidPassword = 
        formData.password.length > 0 && !passwordRegex.test(formData.password);

    // 2. 비밀번호 불일치 검사
    const isPasswordMismatch = 
        formData.passwordConfirm.length > 0 && 
        formData.password !== formData.passwordConfirm;

    // ID 영문 검사
    const isIdValid = /^[A-Za-z0-9]+$/.test(formData.username);

    // 3. 전체 유효성 검사 (버튼 활성화 조건)
    const isAllValid =
        formData.name.trim() !== "" &&
        formData.username.trim() !== "" &&
        isIdValid &&
        passwordRegex.test(formData.password) && // 정규식을 통과해야 함
        formData.password === formData.passwordConfirm;

    return (
        <div className="flex flex-col items-center">
            <InputField
                label="본명 입력"
                placeholder="본명을 입력해주세요"
                isEssential={true}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
            />
            <InputField
                label={
                    usernameError ? `아이디 입력 · ${usernameError}` :
                    !isIdValid && formData.username.length > 0 ? "아이디 입력 · 영문 또는 숫자만 가능합니다" : "아이디 입력"
                }
                isError={!!usernameError || (!isIdValid && formData.username.length > 0)} // 영문이 아니거나 중복일 때 에러 상태
                placeholder="아이디를 입력해주세요"
                isEssential={true}
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
            />
            <InputField 
                // 수정된 에러 판단 변수(isInvalidPassword) 사용
                label={isInvalidPassword ? "비밀번호 입력 · 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다" : "비밀번호 입력"}
                isError={isInvalidPassword} // 에러 상태 전달
                placeholder="비밀번호를 입력해주세요" 
                type="password" 
                showIcon={true} 
                isEssential={true}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
            />
            
            <InputField 
                label={isPasswordMismatch ? "비밀번호 확인 · 비밀번호가 일치하지 않습니다" : "비밀번호 확인"} 
                isError={isPasswordMismatch} // 에러 상태 전달
                placeholder="비밀번호를 다시 입력해주세요" 
                type="password" 
                showIcon={true} 
                isEssential={true}
                value={formData.passwordConfirm}
                onChange={(e) => handleChange("passwordConfirm", e.target.value)}
            />

            <button
                disabled={!isAllValid || checking}
                onClick={handleNext}
                className={`w-75 mt-10 h-10 rounded-lg text-lg font-bold transition-colors
                ${isAllValid && !checking
                    ? 'bg-main text-white hover:bg-main/90'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'}`}
            >
                다음
            </button>
        </div>
    );
}

export default InputData;