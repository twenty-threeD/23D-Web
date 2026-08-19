import WriteInputField from "@/src/components/write/WriteInputField"
import { type PostCategory } from "@/src/lib/post"

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
  onSubmit?: () => void
  isWaiting?: boolean
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
  onSubmit,
  isWaiting,
}: WriteSectionProps) {
  return (
    <div className="w-124 h-186 flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">카테고리</h1>
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : "")}
          className="w-full h-10 border border-zinc-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택 안 함</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.fullName}</option>
          ))}
        </select>
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

      <button
        onClick={onSubmit}
        disabled={isWaiting}
        className="w-32 h-10 bg-main text-white rounded-lg font-bold self-end disabled:opacity-50 cursor-pointer"
      >
        {isWaiting ? "등록 중..." : "등록하기"}
      </button>
    </div>
  )
}
