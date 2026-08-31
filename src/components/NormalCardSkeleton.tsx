export default function NormalCardSkeleton() {
  return (
    <div className="flex flex-col w-64 gap-2 p-3 rounded-lg animate-pulse">
      <div className="h-48 rounded-lg bg-zinc-200" />
      <div className="h-5 w-32 bg-zinc-200 rounded mt-2" />
      <div className="flex justify-between items-center">
        <div className="h-4 w-12 bg-zinc-200 rounded" />
        <div className="h-4 w-20 bg-zinc-200 rounded" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-full bg-zinc-200 rounded" />
        <div className="h-3 w-4/5 bg-zinc-200 rounded" />
      </div>
    </div>
  );
}
