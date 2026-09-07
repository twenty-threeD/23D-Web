import { FaStar, FaStarHalf, FaRegStar } from "react-icons/fa";

type StarRatingProps = {
  rating: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export default function StarRating({ rating, size = "md", interactive = false, onChange }: StarRatingProps) {
  const cls = size === "sm" ? "size-3.5" : "size-5";

  return (
    <div className="flex" role={interactive ? "radiogroup" : undefined} aria-label={interactive ? "별점 선택" : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon =
          rating >= star ? <FaStar className={`text-main ${cls}`} /> :
          rating >= star - 0.5 ? (
            <span className={`relative ${cls}`}>
              <FaStar className={`text-zinc-300 ${cls}`} />
              <FaStarHalf className={`text-main ${cls} absolute top-0 left-0`} />
            </span>
          ) : <FaRegStar className={`text-zinc-300 ${cls}`} />;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-label={`${star}점`}
              aria-checked={rating === star}
              onClick={() => onChange?.(star)}
              className="cursor-pointer p-0.5"
            >
              {icon}
            </button>
          );
        }

        if (rating >= star) {
          return <FaStar key={star} className={`text-main ${cls}`} />;
        } else if (rating >= star - 0.5) {
          return (
            <span key={star} className={`relative ${cls}`}>
              <FaStar className={`text-zinc-300 ${cls}`} />
              <FaStarHalf className={`text-main ${cls} absolute top-0 left-0`} />
            </span>
          );
        } else {
          return <FaRegStar key={star} className={`text-zinc-300 ${cls}`} />;
        }
      })}
    </div>
  );
}
