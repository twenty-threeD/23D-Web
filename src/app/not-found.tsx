
export default function Page() {
    return (
        <div className="flex flex-1 flex-col justify-between">
            <div className="flex flex-col items-center justify-center gap-4 px-20 py-8">
                <h1 className="text-4xl font-bold">404 - 페이지를 찾을 수 없습니다</h1>
                <p className="text-lg text-zinc-600">죄송합니다. 요청하신 페이지가 존재하지 않습니다.</p>
            </div>
        </div>
    );
}