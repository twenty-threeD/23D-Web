// PostItem 과 같은 여백·줄 높이로 자리를 잡는다. 휴대폰은 썸네일이 80px 이라 그 크기를 따른다
export default function PostItemSkeleton() {
  return (
    <div className="flex flex-col gap-2 justify-between items-center shrink-0 py-4 animate-pulse">
      <div className="flex justify-between gap-4 w-full">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center h-7">
            <div className="h-5 w-48 max-w-full bg-zinc-200 rounded-md" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center h-6">
              <div className="h-4 w-full bg-zinc-200 rounded-md" />
            </div>
            <div className="flex items-center h-6">
              <div className="h-4 w-3/4 bg-zinc-200 rounded-md" />
            </div>
          </div>
        </div>
        <div className="size-20 md:size-32 rounded-lg shrink-0 bg-zinc-200" />
      </div>
      <div className="w-full flex justify-end items-center h-5">
        <div className="h-4 w-20 bg-zinc-200 rounded-md" />
      </div>
    </div>
  )
}
