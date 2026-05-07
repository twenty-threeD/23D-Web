import { MdChevronRight } from "react-icons/md"; // 화살표 아이콘 임포트
import Link from "next/link";

interface CheckBoxProps {
    isEssential: boolean;
    label: string;
    link?: string; // 링크는 선택 사항으로
    checked: boolean; // 체크박스의 현재 상태
    onChange: () => void; // 체크박스 상태 변경 시 호출되는 함수
}

export const CheckBox = ({ isEssential, label, link = "#", checked, onChange }: CheckBoxProps) => {
    return (
        <label className="text-[12px] text-[#2F303F] ml-4.75 flex items-center justify-between cursor-pointer py-1 w-62.5 group">
            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    checked={checked} 
                    onChange={onChange} 
                    // 팁: 체크박스 자체도 커서가 포인터여야 사용자가 편합니다
                    className="mr-2 font-semibold accent-[#FE6A4C] w-3 h-3 cursor-pointer" 
                />
                
                {isEssential ? (
                    <span className="text-[#FE6A4C] mr-1">(필수)</span>
                ) : (
                    <span className="text-gray-400 mr-1">(선택)</span>
                )}
                
                <span>{label}</span>
            </div>
            
            <Link 
                href={link} 
                onClick={(e) => e.stopPropagation()} 
                className="text-gray-400 text-lg hover:text-[#FE6A4C] transition-colors"
            >
                <MdChevronRight />
            </Link>
        </label>
    );
};