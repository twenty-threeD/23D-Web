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
        <div className="relative w-75">
          <input
            type={inputType}
            placeholder=" "
            value={value}
            onChange={onChange}
            className={`peer w-full border-b-2 ${isError ? 'border-[#FF0000]' : 'border-zinc-400'} 
                      outline-none p-2 pt-3 bg-transparent
                      ${isError ? 'text-[#FF0000]' : 'text-black'} 
                      focus:text-[#FE6A4C] focus:border-[#FE6A4C]
                      transition-colors`}
          />
          <label className={`absolute left-0 top-3 text-sm transition-all pointer-events-none
                            peer-focus:-top-1 peer-focus:text-xs peer-focus:text-[#FE6A4C]
                            peer-not-placeholder-shown:-top-1 peer-not-placeholder-shown:text-xs
                            ${isError ? 'text-[#FF0000]' : 'text-zinc-400'}`}>
            {placeholder}
          </label>
        </div>

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