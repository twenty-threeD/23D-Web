import Header from "@/src/components/Header";
import Search from "@/src/components/Search";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div>
      <Header />
      <div className="flex px-20 py-8 w-full ">
        {/* 채팅선택 */}
        <div className="flex flex-col gap-2 w-1/4">
          <div className="flex w-full">
            <a href="" className="flex-1">받은 견적</a>
            <a href="" className="flex-1">보낸 견적</a>
            <a href="" className="flex-1">완료된 거래</a>
          </div>
          <Search />
          <div className=""></div>
          <div className=""></div>
        </div>

        {/* 채팅 */}
        <div className=""></div>
      </div>
    </div>
  );
}