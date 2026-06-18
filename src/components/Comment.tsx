import Image from "next/image"

export default function Comment() {
  return (
    <div className="flex gap-2 py-2">
      <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-zinc-300 shrink-0">
        <Image src="/profile.png" alt="프로필사진" className="object-cover" width={48} height={48} />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-md font-bold">권민기</h3>
          <p className="text-sm font-medium">심레이싱 입문한지 7개월차인데, 장비 구성에 대한 자세한 설명과 경험 공유 정말 감사합니다! 저도 가성비 좋은 장비로 시작하려고 하는데, 이 글이 큰 도움이 될 것 같아요. 앞으로도 좋은 정보 많이 공유해주세요!</p>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-zinc-400">2026.06.04. 17:25</span>
          <span className="text-sm font-medium text-zinc-400">답글 쓰기</span>
        </div>
      </div>
    </div>
  )
}