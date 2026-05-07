'use client';

import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io"; // 필요한 것들만 임포트

interface InputProps {
    label: string;
    placeholder: string;
    type?: string;
    showIcon?: boolean; // 이미지 파일 대신 "아이콘을 보여줄지 여부"만 받게 수정
}

export const InputField = ({ label, placeholder, type = "text", showIcon }: InputProps) => {
  const [inputType, setInputType] = useState(type);

  const togglePassword = () => {
    setInputType((prev) => (prev === "password" ? "text" : "password"));
  };

  return (
    <div className="mb-4">
      <div className="group flex flex-col relative">
        <h1 className="text-[10px] font-light text-black 
                      group-focus-within:text-[#FE6A4C] transition-colors"> 
          {label}
        </h1>
        
        <input 
          type={inputType}
          placeholder={placeholder} 
          className="w-75 h-9.5 border-b-2 border-black outline-none px-3
                    text-black focus:text-[#FE6A4C] 
                    focus:border-[#FE6A4C]
                    placeholder:text-[14px] transition-colors
                    pr-10"
        />

        {/* showIcon이 true일 때만 아이콘 표시. 
            inputType에 따라 눈 뜬 모양/감은 모양 전환 
        */}
        {showIcon && (
          <div 
            className="absolute right-2 bottom-1.5 cursor-pointer text-gray-500 hover:text-[#FE6A4C] transition-colors text-xl"
            onClick={togglePassword}
          >
            {inputType === "password" ? <IoMdEyeOff /> : <IoMdEye />}
          </div>
        )}
      </div>
    </div>
  );
};