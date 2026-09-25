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
  imageUrl,
  title,
  rating = 0,
  ratingCount = 0,
  price = "",
  description,
}: PreviewProps) {
  // 가격 포맷팅 (콤마 제거 후 숫자로 변환)
  const numPrice = price.replace(/[^0-9]/g, "");
  const displayPrice = numPrice
    ? `${Number(numPrice).toLocaleString()}원 ~`
    : "가격을 입력해주세요.";
  // 새 글은 아직 리뷰가 없으므로 0.0 대신 시안처럼 '-' 로 보여준다
  const displayRating = ratingCount > 0 ? rating.toFixed(1) : "-";

  return (
    <aside className="w-65 shrink-0 flex flex-col gap-6 sticky top-24 self-start">
      <h2 className="text-xl font-bold text-black leading-none">미리보기</h2>

      <div className="flex flex-col gap-4">
        <div className="w-full h-45 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="미리보기 사진"
              width={260}
              height={180}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm text-ink-muted">사진을 업로드 해주세요.</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-xl font-bold text-black line-clamp-2">
            {title || "제목을 입력해주세요."}
          </h3>

          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <FaStar className="text-main size-3.5" />
              <span className="text-ink-sub">
                {displayRating} ({ratingCount})
              </span>
            </div>
            <span className="font-medium text-ink truncate">{displayPrice}</span>
          </div>
        </div>

        <p className="text-base font-medium text-ink-sub line-clamp-2 whitespace-pre-line">
          {description || "본문을 입력해주세요."}
        </p>
      </div>
    </aside>
  );
}
