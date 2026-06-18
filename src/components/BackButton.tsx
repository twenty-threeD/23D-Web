"use client";

import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className = "" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`flex items-center gap-2 p-2 hover:bg-zinc-100 rounded-full transition ${className}`}
      aria-label="뒤로가기"
    >
      <IoIosArrowBack className="size-6" />
    </button>
  );
}
