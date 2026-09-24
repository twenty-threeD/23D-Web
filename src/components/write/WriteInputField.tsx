"use client";

import type { ReactNode } from "react";

// 서비스 등록 폼의 입력창 공통 스타일. 시안의 보더·라운드·플레이스홀더를 한 곳에서 맞춘다
export const INPUT_BOX =
  "w-full border border-line rounded-[10px] px-[11px] text-xs font-medium text-ink placeholder:text-ink-hint transition-colors focus:outline-none focus:border-main hover:border-ink-hint";

interface FieldLabelProps {
  children: ReactNode;
  isEssential?: boolean;
  // 라벨 오른쪽 끝에 붙는 보조 정보(글자 수 등)
  aside?: ReactNode;
}

export function FieldLabel({ children, isEssential, aside }: FieldLabelProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink leading-none">
        {children}
        {isEssential && <span className="text-xl text-main leading-none">*</span>}
      </h2>
      {aside}
    </div>
  );
}

interface WriteInputFieldProps {
  name: string;
  isEssential?: boolean;
  isText?: boolean;
  isInputPrice?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function WriteInputField({
  name,
  isEssential,
  isText,
  isInputPrice,
  value = "",
  onChange,
  placeholder,
  maxLength,
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

  const counter = isText && maxLength ? (
    <span className="text-xs font-medium text-ink-hint">{value.length}/{maxLength}</span>
  ) : null;

  return (
    <div className="flex flex-col gap-3 w-full">
      <FieldLabel isEssential={isEssential} aside={counter}>{name}</FieldLabel>

      {isText ? (
        <textarea
          className={`${INPUT_BOX} h-72 py-3 resize-none`}
          placeholder={placeholder ?? `${name}을 입력해주세요.`}
          value={value}
          maxLength={maxLength}
          onChange={handleChange}
        />
      ) : isInputPrice ? (
        <label className={`${INPUT_BOX} h-11 flex items-center gap-2 focus-within:border-main`}>
          <input
            type="text"
            inputMode="numeric"
            className="flex-1 min-w-0 focus:outline-none placeholder:text-ink-hint"
            placeholder={placeholder ?? "최소 가격을 입력해주세요."}
            value={displayPrice}
            onChange={handlePriceChange}
          />
          <span className="text-ink-hint">원</span>
        </label>
      ) : (
        <input
          type="text"
          className={`${INPUT_BOX} h-11`}
          placeholder={placeholder ?? `${name}을 입력해주세요.`}
          value={value}
          maxLength={maxLength}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
