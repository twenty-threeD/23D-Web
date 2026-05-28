import { FaStar, FaStarHalf, FaRegStar } from "react-icons/fa";

type StarRatingProps = {
  rating: number;
  size?: "sm" | "md";
};

export default function StarRating({ rating, size = "md" }: StarRatingProps) {
  const cls = size === "sm" ? "size-3.5" : "size-5";
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        if (rating >= star) {
          return <FaStar key={star} className={`text-[#FE6A4C] ${cls}`} />;
        } else if (rating >= star - 0.5) {
          return (
            <span key={star} className={`relative ${cls}`}>
              <FaStar className={`text-zinc-300 ${cls}`} />
              <FaStarHalf className={`text-[#FE6A4C] ${cls} absolute top-0 left-0`} />
            </span>
          );
        } else {
          return <FaRegStar key={star} className={`text-zinc-300 ${cls}`} />;
        }
      })}
    </div>
  );
}