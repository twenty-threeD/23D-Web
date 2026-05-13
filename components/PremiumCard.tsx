export default function PremiumCard(props: { title: string; rating: number; reviewCount: number; description: string }) {
  const { title, rating, reviewCount, description } = props;
  return (
    <div className="flex flex-col w-lg h-64 border-zinc-300 border rounded-lg">
      {/* 이미지 */}
      <div className="w-full h-48 flex items-center justify-start rounded-lg overflow-hidden">
        <div className="w-1/2 h-full bg-zinc-300 overflow-hidden">
          <img src="https://picsum.photos/400/300" alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"/>
        </div>
        <div className="w-1/2 h-full bg-zinc-300 overflow-hidden">
          <img src="https://picsum.photos/200/300" alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"/>
        </div>
      </div>
      {/* 내용 */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-zinc-400">{rating} ({reviewCount})</p>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
}