'use client';

import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

interface InputProps {
    label: string;
    placeholder: string;
    type?: string;
    showIcon?: boolean;
    isEssential?: boolean; // 필수 여부 추가
    isError?: boolean;    // 에러 상태 추가
    value: string;         // 부모로부터 받는 값
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // 값 변경 함수
}

export const InputField = ({ 
    label, 
    placeholder, 
    type = "text", 
    showIcon, 
    isEssential = false, 
    value, 
    isError = false,
    onChange 
}: InputProps) => {
  const [inputType, setInputType] = useState(type);

  const togglePassword = () => {
    setInputType((prev) => (prev === "password" ? "text" : "password"));
  };

  return (
    <div className="mb-4">
      <div className="group flex flex-col relative">
        <h1 className={`text-[10px] font-light ${isError ? 'text-[#FF0000]' : 'text-black'} focus:text-[#FE6A4C] transition-colors`}> 
          {label}
          {/* 필수 항목일 경우 빨간 별표 표시 */}
          {isEssential && <span className={`${isError ? 'text-[#FF0000]' : 'text-[#FE6A4C]'} ml-0.5`}>*</span>}
        </h1>
        
        <input 
          type={inputType}
          placeholder={placeholder} 
          value={value} // 제어 컴포넌트화
          onChange={onChange} // 값 변경 감지
          className={`w-75 h-9.5 border-b-2 ${isError ? 'border-[#FF0000]' : 'border-black'} outline-none px-3
                    ${isError ? 'text-[#FF0000]' : 'text-black'} focus:text-[#FE6A4C] 
                    focus:border-[#FE6A4C]
                    ${isError ? 'border-[#FF0000]' : ''}
                    placeholder:text-[14px] transition-colors
                    pr-10`}
        />

        {showIcon && (
          <div 
            className="absolute right-2 bottom-1.5 cursor-pointer text-black hover:text-[#FE6A4C] transition-colors text-xl"
            onClick={togglePassword}
          >
            {inputType === "password" ? <IoMdEyeOff /> : <IoMdEye />}
          </div>
        )}
      </div>
    </div>
  );
};