"use client"

import {FormEvent, useState} from "react";
import {FiSearch} from "react-icons/fi";

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
        <form onSubmit={handleSubmit} className="flex h-14 w-full items-center rounded-2xl border-2 border-main bg-white px-5">
            <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="해시를 입력해주세요."
                aria-label="해시를 입력해주세요."
                className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-300"
            />
            <button
                type="submit"
                aria-label="검색"
                className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center text-gray-400 transition-colors hover:text-main"
            >
                <FiSearch size={28} strokeWidth={1.8} />
            </button>
        </form>
    )
}