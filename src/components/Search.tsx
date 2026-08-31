"use client";

import { useState } from "react";
import { IoIosSearch } from "react-icons/io";

interface SearchProps {
  isTop?: boolean;
  where?: "header" | "post" | "chat";
  initialValue?: string;
  onSearch?: (keyword: string) => void;
}

export default function Search({ isTop, where, initialValue = "", onSearch }: SearchProps) {
  const [value, setValue] = useState(initialValue);
  const isHeader = where === "header";
  const isChat = where === "chat";

  const styleClass = isHeader
    ? (isTop ? "hidden" : "flex items-center gap-2 w-lg px-4 py-2 border border-zinc-300 rounded-lg")
    : "flex items-center gap-2 w-full px-4 py-2 border border-zinc-300 rounded-lg";

  const placeholderText =
    where === "post" ? "검색어를 입력해주세요" :
    isChat ? "검색" :
    "무슨 능력자가 필요한가요?";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    if (isChat) onSearch?.(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearch?.(value);
  }

  return (
    <div className={styleClass}>
      <IoIosSearch
        className="text-zinc-500 text-2xl cursor-pointer"
        onClick={() => onSearch?.(value)}
      />
      <input
        className="text-lg font-semibold focus:outline-none w-full"
        placeholder={placeholderText}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};