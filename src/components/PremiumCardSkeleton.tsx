export default function PremiumCardSkeleton() {
  return (
    <div className="flex flex-col w-lg h-72 p-3 rounded-lg animate-pulse">
      <div className="w-full h-32 bg-zinc-200 rounded-lg" />
      <div className="flex flex-col gap-2 py-4">
        <div className="h-5 w-40 bg-zinc-200 rounded" />
        <div className="flex flex-col gap-1">
          <div className="h-3 w-full bg-zinc-200 rounded" />
          <div className="h-3 w-3/4 bg-zinc-200 rounded" />
        </div>
      </div>
    </div>
  );
}
