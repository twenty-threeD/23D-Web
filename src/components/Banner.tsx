import Image from "next/image";

interface BannerProps {
    imageUrl?: string;
}

// 대체 이미지(/profile_banner.png)는 public 에 없어 깨져 보였다. 이미지가 없으면 회색 배경만 둔다.
export default function Banner({ imageUrl }: BannerProps) {
    return (
        <div className="relative w-full h-48 bg-zinc-300 overflow-hidden">
            {imageUrl && (
                <Image src={imageUrl} alt="서비스 헤더 이미지" fill sizes="100vw" className="object-cover" />
            )}
        </div>
    );
}
