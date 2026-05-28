import Image from "next/image";
import { FaStar } from "react-icons/fa";

export default function Preview() {
  return (
    <div className="w-82 h-186 flex flex-col gap-4 border-l border-zinc-300 px-10">
        <h1 className="text-xl font-bold">미리보기</h1>

        <div className="w-full h-40 rounded-lg overflow-hidden bg-zinc-100">
            <Image
                src="/path/to/image.jpg"
                alt="미리보기 이미지"
                width={260}
                height={160}
                className="w-full h-full object-cover"
            />
        </div>

        <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">오늘의 연애</h2>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <FaStar className="text-[#FE6A4C] size-5" />
                    <span className="text-sm text-zinc-500">0.0 (0)</span>
                </div>
                <span className="text-sm">10,000원 ~</span>
            </div>

            <p className="text-sm text-zinc-700">
            연애하는 방법 58000% 쉽게 알려드립니다!!
            </p>
        </div>
    </div>
  );
}