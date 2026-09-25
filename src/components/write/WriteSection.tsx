import WriteInputField, { FieldLabel, INPUT_BOX } from "@/src/components/write/WriteInputField"
import { type PostCategory } from "@/src/lib/post"
import { LuChevronDown } from "react-icons/lu"

// 서버가 본문을 2000자로 제한한다. 실제 검증은 플랜까지 직렬화한 길이로 page 에서 한 번 더 한다
const MAX_DESCRIPTION = 2000
const MAX_TITLE = 255

interface WriteSectionProps {
  title: string
  onTitleChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  price: string
  onPriceChange: (value: string) => void
  categoryId: number | ""
  onCategoryChange: (value: number | "") => void
  categories: PostCategory[]
}

export default function WriteSection({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  categoryId,
  onCategoryChange,
  categories,
}: WriteSectionProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-[33px]">
      <div className="flex flex-col gap-3">
        <FieldLabel isEssential>카테고리</FieldLabel>
        <div className="relative">
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : "")}
            className={`${INPUT_BOX} h-[38px] text-sm pr-10 appearance-none cursor-pointer ${categoryId === "" ? "text-ink-hint" : ""}`}
          >
            <option value="">카테고리를 선택해주세요.</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="text-ink">{c.fullName}</option>
            ))}
          </select>
          <LuChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[22px] text-ink pointer-events-none" />
        </div>
      </div>
      <WriteInputField
        name="제목"
        isEssential
        value={title}
        maxLength={MAX_TITLE}
        onChange={onTitleChange}
      />
      <WriteInputField
        name="본문"
        isEssential
        isText
        value={description}
        maxLength={MAX_DESCRIPTION}
        onChange={onDescriptionChange}
      />
      <WriteInputField
        name="최소 가격"
        isEssential
        isInputPrice
        value={price}
        onChange={onPriceChange}
      />
    </div>
  )
}
