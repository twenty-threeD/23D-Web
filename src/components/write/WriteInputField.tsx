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
    const formatted = raw ? num.toLocaleString() : "";
    onChange?.(formatted);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1 w-124">
      <h1 className="text-xl font-bold">
        {name}
        {isEssential && <span className="text-red-500">*</span>}
      </h1>

      {isText ? (
        <textarea
          className="w-full h-64 border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={`${name}을 입력해주세요.`}
          value={value}
          onChange={handleChange}
        />
      ) : isInputPrice ? (
        <div className="flex items-center w-full h-10 border border-zinc-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500">
          <input
            type="text"
            className="flex-1 focus:outline-none"
            placeholder="가격을 입력해주세요."
            value={value}
            onChange={handlePriceChange}
          />
          <span className="text-zinc-500 ml-1">원</span>
        </div>
      ) : (
        <input
          type="text"
          className="w-full h-10 border border-zinc-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`${name}을 입력해주세요.`}
          value={value}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
