'use client';

import Image from 'next/image';

interface PageProps {
    imgPath: string;
}

export const Estimate = ({ imgPath }: PageProps) => {
    return (
        <div>
            <h1 className="font-bold text-xl">견적서 확인</h1>

            <div className="w-223 h-129.75 border border-gray-300 bg-white rounded-xl relative overflow-hidden">
                <div className="relative w-20 h-20"> 
                    <Image 
                        src={imgPath} 
                        alt="견적서" 
                        fill 
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            </div>
        </div>
    );
}