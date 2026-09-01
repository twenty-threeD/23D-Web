export default function PostItemSkeleton() {
  return (
    <div className="flex flex-col gap-2 justify-between items-center shrink-0 py-4 animate-pulse">
      <div className="flex justify-between w-full">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-6 w-48 bg-zinc-200 rounded-md" />
          <div className="h-4 w-full bg-zinc-200 rounded-md" />
          <div className="h-4 w-3/4 bg-zinc-200 rounded-md" />
        </div>
        <div className="w-32 h-32 rounded-lg shrink-0 ml-4 bg-zinc-200" />
      </div>
      <div className="w-full flex justify-end">
        <div className="h-4 w-20 bg-zinc-200 rounded-md" />
      </div>
    </div>
  )
}
