"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

import UploadFile from "@/src/components/write/UploadPicture";
import WriteSection from "@/src/components/write/WriteSection";
import Preview from "@/src/components/write/Preview";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("/path/to/image.jpg");

  const handleSubmit = () => {
    console.log({
      title,
      description,
      price,
      imageUrl,
    });
    // 여기에 API 호출 또는 다른 로직 추가
  };

  return (
    <div>
      <Header />
      <div className="px-20 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 p-2 hover:bg-zinc-100 rounded-full transition"
        >
          <IoIosArrowBack className="size-6" />
        </button>
      </div>
      <main className="flex justify-between gap-4 px-20">
        <UploadFile />
        <WriteSection
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          price={price}
          onPriceChange={setPrice}
          onSubmit={handleSubmit}
        />
        <Preview
          imageUrl={imageUrl}
          title={title}
          description={description}
          price={price}
        />
      </main>
      <Footer />
    </div>
  );
}
