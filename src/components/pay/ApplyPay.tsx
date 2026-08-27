interface ApplyPayProps {
    isAgree: boolean;
    setIsAgree: (value: boolean) => void;
}

export const ApplyPay = ({ isAgree, setIsAgree }: ApplyPayProps) => {
    return (
        <div className="w-87.5 border p-5 gap-5 border-zinc-300 rounded-lg">
            <div className="flex items-center gap-2.5">
                <input 
                    type="checkbox" 
                    id="terms"
                    checked={isAgree} // 현재 상태 연결
                    onChange={(e) => setIsAgree(e.target.checked)} // 클릭 시 상태 변경
                    className="font-semibold accent-main w-7 h-7 cursor-pointer" 
                />
                <label htmlFor="terms" className="text-xl text-zinc-600 cursor-pointer">
                    구매조건 및 결제진행 동의
                </label>
            </div>
            
            <hr className="mt-3 mb-4 text-zinc-300"/>

            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-zinc-400">
                    구매할 서비스와 서비스가격, 출장비등을명확히 확인하였으며
                    구매진행에 동의하시겠습니까?
                </p>
                <p className="text-[12px] text-zinc-400">
                    서비스 구매 이후 7일 이내에만 환불가능합니다.
                </p>
                <p className="text-[12px] text-zinc-400">
                    구매기록과 계약서는 영구적으로 저장됩니다.
                </p>
            </div>
        </div>
    );
};