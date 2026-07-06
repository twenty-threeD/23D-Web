import Link from "next/link";

interface PremiumCardProps {
  id: number
  title: string
  content: string
  fileUrl?: string
}

function getDescription(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return parsed.description ?? content
  } catch {
    return content
  }
}

export default function PremiumCard({ id, title, content, fileUrl }: PremiumCardProps) {
  const description = getDescription(content)

  return (
    <Link href={`/item/${id}`} className="flex flex-col w-lg h-72 p-3 rounded-lg hover:scale-105 hover:shadow-lg transition-transform duration-300">
      <div className="w-full min-h-32 bg-zinc-300 flex items-center justify-start rounded-lg overflow-hidden">
        {fileUrl ? (
          <img src={fileUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-200" />
        )}
      </div>
      <div className="flex flex-col gap-2 py-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg line-clamp-1">{title}</h2>
        </div>
        <p className="text-zinc-500 line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}
