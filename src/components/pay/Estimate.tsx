'use client';

import { FaStar } from "react-icons/fa";

import Image from 'next/image';

interface PageProps {
    imgPath: string;
    title: string;
    avgRating?: number;
    reviewCount?: number;

    serviceCategory?: string;
    expertName?: string;
    deliveryTime?: string;
}

export const Estimate = ({ imgPath, title, avgRating, reviewCount, 
    serviceCategory, expertName, deliveryTime }: PageProps) => {
    return (
        <div className="w-210">
            <div className="border p-5 gap-5 border-zinc-300 rounded-lg">
                
                <div className="flex items-center gap-2.5">
                    {/* 이미지 */}
                    <div className="w-20 h-20 border border-zinc-300 rounded-full overflow-hidden relative"> 
                        <Image
                            src={imgPath}
                            alt="견적서 이미지"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* 제목과 평점 */}
                    <div className="flex flex-col gap-3">
                        <h1 className="text-2xl font-bold">{title}</h1>
                        {reviewCount ? (
                            <div className="flex items-center gap-1">
                                <FaStar className="text-main size-5"/>
                                <h1 className="text-lg">{(avgRating ?? 0).toFixed(1)}</h1>
                                <p className="text-sm text-zinc-400">({reviewCount.toLocaleString()})</p>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400">아직 등록된 후기가 없어요</p>
                        )}
                    </div>
                </div>

                {/* 분류. 값이 없는 항목은 라벨만 덩그러니 남지 않게 감춘다 */}
                <div className="mt-9 flex flex-col gap-1">
                    {serviceCategory && (
                        <div className="flex items-center gap-2 justify-between">
                            <p className="text-5 text-zinc-500">서비스</p>
                            <p className="text-5">{serviceCategory}</p>
                        </div>
                    )}

                    {expertName && (
                        <div className="flex items-center gap-2 justify-between">
                            <p className="text-5 text-zinc-500">능력자</p>
                            <p className="text-5">{expertName}</p>
                        </div>
                    )}

                    {deliveryTime && (
                        <div className="flex items-center gap-2 justify-between">
                            <p className="text-5 text-zinc-500">납기일</p>
                            <p className="text-5">{deliveryTime}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}