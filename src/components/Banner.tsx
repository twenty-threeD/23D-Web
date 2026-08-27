interface BannerProps {
    imageUrl?: string;
}

export default function Banner({ imageUrl }: BannerProps) {
    return (
        <div className="w-full h-48 bg-zinc-300 flex items-center justify-center overflow-hidden">
            <img src={imageUrl || "/profile_banner.png"} alt="서비스 헤더 이미지" className="w-full h-full object-cover"/>
        </div>
    );
}
