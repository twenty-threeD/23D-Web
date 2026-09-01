"use client";

interface WriteInputFieldProps {
  name: string;
  isEssential?: boolean;
  isText?: boolean;
  isInputPrice?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export default function WriteInputField({
  name,
  isEssential,
  isText,
  isInputPrice,
  value = "",
  onChange,
}: WriteInputFieldProps) {
  const MAX_PRICE = 2_000_000_000; // 최대 가격 설정

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 추출
    const num = Number(raw);
    if (num > MAX_PRICE) return;
    onChange?.(raw); // 상태에는 콤마 없는 순수 숫자 문자열만 저장
  };

  const displayPrice = value ? Number(value).toLocaleString() : "";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <h1 className="text-xl font-bold">
        {name}
        {isEssential && <span className="text-red-500">*</span>}
      </h1>

      {isText ? (
        <textarea
          className="w-full h-64 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 resize-none"
          placeholder={`${name}을 입력해주세요.`}
          value={value}
          onChange={handleChange}
        />
      ) : isInputPrice ? (
        <div className="w-full flex items-center gap-1 border border-zinc-300 rounded-lg px-3 py-2.5 transition-colors focus-within:border-main hover:border-zinc-400">
          <input
            type="text"
            className="flex-1 focus:outline-none"
            placeholder="가격을 입력해주세요."
            value={displayPrice}
            onChange={handlePriceChange}
          />
          <span className="text-zinc-500 ml-1">원</span>
        </div>
      ) : (
        <input
          type="text"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
          placeholder={`${name}을 입력해주세요.`}
          value={value}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
