import { useState, useEffect } from "react"
import { IoIosArrowUp } from "react-icons/io";

export default function TopButton() {
  const [isTop, setIsTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsTop(window.scrollY === 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={isTop ? "hidden" : "fixed bottom-6 right-6 z-20 flex items-center justify-center rounded-full bg-main p-3 text-white shadow-lg hover:bg-orange-600"}
      aria-label="맨위로 이동"
    >
      <IoIosArrowUp className="text-2xl" />
    </button>
  )
}