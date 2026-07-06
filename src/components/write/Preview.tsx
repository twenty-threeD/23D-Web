import Image from "next/image";
import { FaStar } from "react-icons/fa";

interface PreviewProps {
  imageUrl?: string;
  title?: string;
  rating?: number;
  ratingCount?: number;
  price?: string;
  description?: string;
}

export default function Preview({
  imageUrl = "/path/to/image.jpg",
  title = "제목을 입력하세요",
  rating = 0,
  ratingCount = 0,
  price = "0",
  description = "본문을 입력하세요",
}: PreviewProps) {
  // 가격 포맷팅 (콤마 제거 후 숫자로 변환)
  const numPrice = price.replace(/[^0-9]/g, "");
  const displayPrice = numPrice
    ? `${Number(numPrice).toLocaleString()}원 ~`
    : "가격을 입력하세요";

  return (
    <div className="w-82 h-186 flex flex-col gap-4 border-l border-zinc-300 px-10">
      <h1 className="text-xl font-bold">미리보기</h1>

      <div className="w-full h-40 rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center">
        {imageUrl && imageUrl !== "/path/to/image.jpg" ? (
          <Image
            src={imageUrl}
            alt="미리보기 이미지"
            width={260}
            height={160}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm text-zinc-400">이미지를 업로드해주세요</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold line-clamp-2">
          {title || "제목을 입력하세요"}
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <FaStar className="text-[#FE6A4C] size-5" />
            <span className="text-sm text-zinc-500">
              {rating.toFixed(1)} ({ratingCount})
            </span>
          </div>
          <span className="text-sm">{displayPrice}</span>
        </div>

        <p className="text-sm text-zinc-700 line-clamp-2">
          {description || "본문을 입력하세요"}
        </p>
      </div>
    </div>
  );
}
