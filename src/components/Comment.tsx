import Image from "next/image"

interface CommentProps {
  authorName: string
  content: string
  createdAt: string
  profileImage?: string
}

export default function Comment({ authorName, content, createdAt, profileImage }: CommentProps) {
  return (
    <div className="flex gap-2 py-2">
      <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-zinc-300 shrink-0">
        <Image
          src={profileImage ?? "/profile.png"}
          alt="프로필사진"
          className="object-cover"
          width={48}
          height={48}
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-md font-bold">{authorName}</h3>
        <p className="text-sm font-medium">{content}</p>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-zinc-400">{createdAt}</span>
          <span className="text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-600">답글 쓰기</span>
        </div>
      </div>
    </div>
  )
}
