"use client"

import {FormEvent, useState} from "react";
import {LuSearch} from "react-icons/lu";

interface SearchInputProps {
    onSearch: (input: string) => void
}

export default function SearchInput({ onSearch }: SearchInputProps) {
    const [input, setInput] = useState("")
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedInput = input.trim()

        if (!trimmedInput) { return }

        onSearch(trimmedInput)
    }

    return (
        <form onSubmit={handleSubmit} className="flex h-13 w-full items-center rounded-xl border-2 border-main bg-white pl-[22px] pr-[26px]">
            <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="해시를 입력해주세요."
                aria-label="해시를 입력해주세요."
                className="min-w-0 flex-1 bg-transparent text-base font-medium text-black outline-none placeholder:text-[#aaa]"
            />
            <button
                type="submit"
                aria-label="검색"
                className="ml-4 flex size-6 shrink-0 items-center justify-center"
            >
                <LuSearch className="size-6 text-[#aaa]" />
            </button>
        </form>
    )
}
