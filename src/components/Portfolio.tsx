export default function Portfolio() {
  return (
    <div className="flex flex-1 flex-col gap-1 justify-center items-start min-w-0">
      <div className="w-full aspect-square rounded-lg bg-zinc-300 overflow-hidden">
          <img
            src="https://picsum.photos/seed/1/400/400"
            alt="포트폴리오 이미지"
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-lg font-semibold">
          만촌동 에어컨 설치
        </h3>
        <p className="w-full text-sm font-semibold text-zinc-400 truncate">
          만촌동에 위치한 30평형 아파트에 에어컨 설치를 진행했습니다. 고객님께서 원하시는 위치에 맞춰 최적의 설치 방안을 제안드렸고, 안전하게 작업을 완료하였습니다. 고객님께서는 설치 후 만족스러운 결과에 매우 기뻐하셨습니다.
        </p>
    </div>
  )
}