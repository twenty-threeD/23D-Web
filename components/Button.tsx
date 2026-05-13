import Link from "next/link";

export default function Button(props: { text: string, to: string }) {
  return (
    <Link href={props.to} className="w-full py-2 border text-center border-zinc-300 rounded-md">
      {props.text}
    </Link>
  )
}