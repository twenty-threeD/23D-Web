import WriteInputField from "@/src/components/write/WriteInputField"
import { type PostCategory } from "@/src/lib/post"
import { IoChevronDown } from "react-icons/io5"

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
    <div className="w-full flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">카테고리<span className="text-red-500">*</span></h1>
        <div className="relative">
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-10 border border-zinc-300 rounded-lg pl-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">카테고리를 선택해주세요</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
          <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg pointer-events-none" />
        </div>
      </div>
      <WriteInputField
        name="제목"
        isEssential={true}
        value={title}
        onChange={onTitleChange}
      />
      <WriteInputField
        name="본문"
        isEssential={true}
        isText={true}
        value={description}
        onChange={onDescriptionChange}
      />
      <WriteInputField
        name="가격 입력 (최소)"
        isEssential={true}
        isInputPrice={true}
        value={price}
        onChange={onPriceChange}
      />
    </div>
  )
}
