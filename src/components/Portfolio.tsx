export default function Portfolio() {
  return (
    <div className="w-1/3 flex flex-col gap-2 justify-between items-center">
      <div className="rounded-lg bg-zinc-300 overflow-hidden">
          <img
            src="https://picsum.photos/seed/1/400/400"
            alt="포트폴리오 이미지"
            className="w-full h-full object-cover"
          />
        </div>
    </div>
  )
}