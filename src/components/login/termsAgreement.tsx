'use client';
import { useState } from "react";
import { CheckBox } from "./CheckBox";

interface TermsAgreementProps {
    onNext: () => void; // 다음 단계로 넘어갈 때 실행할 함수
}

const TermsAgreement = ({ onNext }: TermsAgreementProps) => {
    const [terms, setTerms] = useState({
        service: false,
        privacy: false,
        thirdParty: false,
        location: false,
    });

    const handleAllAgree = () => {
        const isAllChecked = Object.values(terms).every((v) => v);
        const newValue = !isAllChecked;
        setTerms({
            service: newValue,
            privacy: newValue,
            thirdParty: newValue,
            location: newValue,
        });
    };

    const handleCheck = (key: keyof typeof terms) => {
        setTerms((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isEssentialAgreed = terms.service && terms.privacy && terms.thirdParty;

    return (
        <div className="w-full ml-30 mt-5 flex flex-col">
            {/* 전체 동의 */}
            <label className="text-[12px] text-slate-800 ml-4.75 flex items-center cursor-pointer font-bold">
                <input 
                    type="checkbox" 
                    checked={Object.values(terms).every((v) => v)}
                    onChange={handleAllAgree}
                    className="mr-2 accent-[#FE6A4C] w-3 h-3" 
                />
                전체 동의하기
            </label>

            <div className="w-62.5 h-px bg-gray-300 mt-2 mb-2 ml-4.75"></div>

            {/* 개별 체크박스들 */}
            <CheckBox isEssential={true} label="'잇다' 서비스 이용약관" link="/terms/service" checked={terms.service} onChange={() => handleCheck('service')} />
            <CheckBox isEssential={true} label="개인정보 수집 및 이용 동의" link="/terms/privacy" checked={terms.privacy} onChange={() => handleCheck('privacy')} />
            <CheckBox isEssential={true} label="제 3자 개인정보 수집 이용 동의" link="/terms/third-party" checked={terms.thirdParty} onChange={() => handleCheck('thirdParty')} />

            <div className="w-62.5 h-px bg-gray-300 mt-2 mb-2 ml-4.75"></div>

            <CheckBox isEssential={false} label="위치기반 서비스 이용약관" link="/terms/location" checked={terms.location} onChange={() => handleCheck('location')} />

            {/* 다음 버튼 */}
            <button 
                onClick={onNext}
                disabled={!isEssentialAgreed} 
                className={`w-75 h-10 text-white rounded-lg text-lg font-bold transition-colors 
                ${isEssentialAgreed ? 'bg-[#FE6A4C] hover:bg-[#FE6A4C]/90' : 'bg-gray-400 cursor-not-allowed'}`}
            >
                다음
            </button>
        </div>
    );
};

export default TermsAgreement;