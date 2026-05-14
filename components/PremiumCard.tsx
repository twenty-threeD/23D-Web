export default function PremiumCard(props: { title: string; rating: number; reviewCount: number; description: string }) {
  const { title, rating, reviewCount, description } = props;
  return (
    <div className="flex flex-col w-lg h-72 p-3 rounded-lg hover:scale-105 hover:shadow-lg transition-transform duration-300">
      {/* 이미지 */}
      <div className="w-full min-h-32 bg-zinc-300 flex items-center justify-start rounded-lg overflow-hidden">
        <img src="https://picsum.photos/400/300" alt="" className="w-1/2 h-full object-cover"/>
        <img src="https://picsum.photos/400/300" alt="" className="w-1/2 h-full object-cover"/>
      </div>
      {/* 내용 */}
      <div className="flex flex-col gap-2 py-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-zinc-400">{rating} ({reviewCount})</p>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
}