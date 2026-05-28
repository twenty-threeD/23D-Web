"use client";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import { UploadFile } from "@/src/components/write/UploadPicture";
import { Preview } from "@/src/components/write/Preview";

const Page = () => {
    return (
        <div>
            <Header />
            <main className="flex justify-between gap-4 py-16 px-20 h-186.5">
                <UploadFile />
                <Preview />
            </main>
            <Footer />
        </div>
    );
};

export default Page;