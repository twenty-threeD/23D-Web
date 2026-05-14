export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">채팅방 ID: {id}</h1>
    </div>
  );
}