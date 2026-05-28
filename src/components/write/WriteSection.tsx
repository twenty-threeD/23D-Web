import WriteInputField from "@/src/components/write/WriteInputField";

export default function WriteSection() {
    return (
        <div className="w-124 h-186 flex flex-col gap-7">
            <WriteInputField name="제목" isEssential={true} />
            <WriteInputField name="본문" isEssential={true} isText={true} />
            <WriteInputField name="가격 입력 (최소)" isEssential={true} isInputPrice={true} />

            <button className="w-32 h-10 bg-[#FE6A4C] text-white rounded-lg font-bold self-end">
                등록하기
            </button>
        </div>
    );
}