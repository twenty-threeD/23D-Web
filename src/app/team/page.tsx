import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

const members = [
  { name: "김경윤", role: "PM / BackEnd / BlockChain" },
  { name: "권민기", role: "BackEnd" },
  { name: "김승우", role: "PM / BackEnd" },
  { name: "김준현", role: "BackEnd" },
  { name: "이도건", role: "FrontEnd / Design" },
  { name: "안재민", role: "FrontEnd / Design" },
  { name: "이재원", role: "3D Modeling" },
];

export default function Page() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <Header />
      <main className="flex-1 px-5 py-10 lg:px-20 lg:py-16">
        <div className="mx-auto w-full max-w-6xl">
          <header className="border-b border-zinc-200 py-8 lg:py-10">
            <p className="pb-3 text-sm font-bold tracking-wide text-main">
              MEET THE TEAM
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 lg:text-4xl">
              팀원 소개
            </h1>
            <p className="max-w-2xl pt-4 text-sm leading-6 text-zinc-500 lg:text-base">
              잇다를 함께 만들고 있는 팀원들을 소개합니다.
            </p>
          </header>

          <section
            aria-label="잇다 팀원 목록"
            className="grid gap-x-8 gap-y-10 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-14 lg:py-16"
          >
            {members.map((member, index) => (
              <article
                key={member.name}
                className={`flex min-h-28 flex-col justify-center border-b-2 border-zinc-900 pb-5 ${
                  index === 0
                    ? "sm:col-span-2 sm:mx-auto sm:w-1/2 lg:col-start-2 lg:col-span-1 lg:w-full lg:row-start-1"
                    : index === 1
                      ? "lg:col-start-1 lg:row-start-2"
                      : index === 2
                        ? "lg:col-start-2 lg:row-start-2"
                        : index === 3
                          ? "lg:col-start-3 lg:row-start-2"
                          : index === 4
                            ? "lg:col-start-1 lg:row-start-3"
                            : index === 5
                              ? "lg:col-start-2 lg:row-start-3"
                              : "lg:col-start-3 lg:row-start-3"
                }`}
              >
                <p className="text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl">
                  {member.name}
                </p>
                <p className="pt-2 text-sm text-zinc-600 lg:text-base">
                  {member.role}
                </p>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
