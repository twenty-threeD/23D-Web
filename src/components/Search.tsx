"use client";

import { useState } from "react";
import { IoIosSearch } from "react-icons/io";

interface SearchProps {
  isTop?: boolean;
  where?: "header" | "post";
  onSearch?: (keyword: string) => void;
}

export default function Search({ isTop, where, onSearch }: SearchProps) {
  const [value, setValue] = useState("");
  const isHeader = where === "header";
  const isPost = where === "post";

  const styleClass = isHeader
    ? (isTop ? "hidden" : "flex items-center gap-2 w-lg px-4 py-2 border border-zinc-300 rounded-lg")
    : "flex items-center gap-2 w-full px-4 py-2 border border-zinc-300 rounded-lg";

  const placeholderText = isPost
    ? "검색어를 입력해주세요"
    : "무슨 능력자가 필요한가요?";

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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};