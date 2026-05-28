import { CiCamera } from "react-icons/ci";
import Image from "next/image";

export default function UploadFile() {
  return (
    <div className="w-82 h-109 rounded-lg flex flex-col gap-9.5">
        <div className="h-82 flex flex-col items-center justify-center border border-zinc-300 rounded-lg bg-zinc-50">
            <CiCamera className="text-9xl" />
            <span className="text-xl font-bold">사진을 업로드 해주세요.</span>
        </div>

        {/* overflow-x-auto로 가로 스크롤 활성화 */}
        <div className="h-18 flex rounded-lg gap-2 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((i) => (
            // shrink-0으로 찌그러짐 방지, w-18로 고정 너비
            <div
                key={i}
                className="shrink-0 w-18 h-18 border border-zinc-300 rounded-lg bg-zinc-50"
            >
                <Image
                src="/path/to/image.jpg"
                alt="이미지"
                width={72}
                height={72}
                className="w-full h-full object-cover rounded-lg"
                />
            </div>
            ))}
        </div>
    </div>
  );
};