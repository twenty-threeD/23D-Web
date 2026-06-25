import WriteInputField from "@/src/components/write/WriteInputField"

interface WriteSectionProps {
  title: string
  onTitleChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  price: string
  onPriceChange: (value: string) => void
  onSubmit?: () => void
}

export default function WriteSection({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  onSubmit,
}: WriteSectionProps) {
  return (
    <div className="w-124 h-186 flex flex-col gap-7">
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
        className="w-32 h-10 bg-[#FE6A4C] text-white rounded-lg font-bold self-end"
      >
        등록하기
      </button>
    </div>
  )
}
