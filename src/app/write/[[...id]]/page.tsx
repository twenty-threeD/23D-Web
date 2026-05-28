"use client";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import UploadFile from "@/src/components/write/UploadPicture";
import Preview from "@/src/components/write/Preview";

export default function Page() {
    return (
        <div>
            <Header />
            <main className="flex justify-between gap-4 px-20">
                <UploadFile />
                <Preview />
            </main>
            <Footer />
        </div>
    );
};