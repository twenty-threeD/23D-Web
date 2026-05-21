interface PageProps {
    defaultAmount: number;
    additionalAmount?: number;
    travelCost?: number;
    pointUsage?: number;
}

export const FinalBill = ({ defaultAmount, additionalAmount, travelCost, pointUsage }: PageProps) => {
    return (
        <div className="w-87.5 border p-5 gap-5 border-gray-300 rounded-lg">
            <h1 className="text-5">최종 결제 금액</h1>
            <hr className="mt-3 mb-4 text-gray-300"/>

            <div className="flex items-center gap-2.5 justify-between">
                <p>기본금액</p>
                <p>{defaultAmount.toLocaleString()}원</p>
            </div>

            <div className="flex items-center gap-2.5 justify-between">
                <p>추가금액</p>
                <p>{additionalAmount?.toLocaleString()}원</p>
            </div>

            <div className="flex items-center gap-2.5 justify-between">
                <p>출장비</p>
                <p>{travelCost?.toLocaleString()}원</p>
            </div>

            <div className="flex items-center gap-2.5 justify-between">
                <p>포인트</p>
                <p>{pointUsage?.toLocaleString()}P</p>
            </div>

            <hr className="my-5 text-gray-300"/>

            <div className="flex items-baseline justify-between">
                <p className="text-[#FE6A4C] font-bold">총 결제 예정 금액</p>
                <p className="text-2xl text-[#FE6A4C]  font-bold">
                    {(defaultAmount + (additionalAmount || 0) + (travelCost || 0)).toLocaleString()}원
                </p>
            </div>

            <p className="text-xs text-zinc-600">수수료 포함</p>
        </div>
    );
};