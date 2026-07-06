"use client";

import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

interface InputProps {
  label: string;
  placeholder: string;
  type?: string;
  showIcon?: boolean;
  isEssential?: boolean;
  isError?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const InputField = ({
  label,
  placeholder,
  type = "text",
  showIcon,
  value,
  isError = false,
  onChange,
  onKeyDown,
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
            onKeyDown={onKeyDown}
            className={`peer w-full border-b-2 ${isError ? "border-[#FF0000]" : "border-zinc-400"} 
                  outline-none p-2 pt-3 bg-transparent
                  ${isError ? "text-[#FF0000]" : "text-black"} 
                  focus:text-main focus:border-main
                  transition-colors`}
          />
          <label
            className={`absolute left-0 top-3 text-sm transition-all pointer-events-none
                        peer-focus:-top-1 peer-focus:text-xs peer-focus:text-main
                        peer-not-placeholder-shown:-top-1 peer-not-placeholder-shown:text-xs
                        ${isError ? "text-[#FF0000]" : "text-zinc-400"}`}
          >
            {placeholder}
          </label>
        </div>

        {showIcon && (
          <div
            className="absolute right-2 bottom-1.5 cursor-pointer text-black hover:text-main transition-colors text-xl"
            onClick={togglePassword}
          >
            {inputType === "password" ? <IoMdEyeOff /> : <IoMdEye />}
          </div>
        )}
      </div>

      {/* 에러 메시지만 아래에 */}
      {isError && <p className="text-xs text-[#FF0000] mt-1 w-75">{label}</p>}
    </div>
  );
};
