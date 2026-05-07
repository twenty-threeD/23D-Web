'use client';

import { useState } from "react";
import Image from "next/image";
import { StaticImageData } from "next/image";

interface InputProps {
    label: string;
    placeholder: string;
    type?: string;
    icon?: string | StaticImageData;
}

export const InputField = ({ label, placeholder, type = "text", icon }: InputProps) => {
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

        {icon && (
          <div 
            className="absolute right-2 bottom-1.5 cursor-pointer hover:opacity-70"
            onClick={togglePassword}
          >
            <Image src={icon} alt="toggle visibility" width={20} height={20} />
          </div>
        )}
      </div>
    </div>
  );
};