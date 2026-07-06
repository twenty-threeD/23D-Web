"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import BackButton from "@/src/components/BackButton";
import UploadFile from "@/src/components/write/UploadPicture";
import WriteSection from "@/src/components/write/WriteSection";
import Preview from "@/src/components/write/Preview";
import PriceCardEditor from "@/src/components/write/PriceCardEditor";
import { useAuthStore } from "@/src/store/authStore";
import { createPost } from "@/src/lib/post";
import { useHandleError } from "@/src/hooks/useHandleError";
import { useToast } from "@/src/hooks/useToast";
import { type PriceCardPlan } from "@/src/types/priceCard";

const DEFAULT_PLAN: PriceCardPlan = {
  planName: "",
  price: "",
  description: "",
  items: [],
}

export default function Page() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const handleError = useHandleError();
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [plan, setPlan] = useState<PriceCardPlan>(DEFAULT_PLAN);
  const [isWaiting, setIsWaiting] = useState(false);

  async function handleSubmit() {
    if (!token) { router.push("/login/signin"); return; }
    if (!title.trim() || !description.trim()) {
      addToast({ message: "제목과 본문을 입력해주세요.", type: "warning" });
      return;
    }
    setIsWaiting(true);
    try {
      const effectivePlan = { ...plan, price: plan.price || price };
      const content = JSON.stringify({ description, plan: effectivePlan });
      const fileUrls = imageUrl ? [imageUrl] : [];
      const res = await createPost(token, { title, content, fileUrls });
      const postId = res.data?.id;
      if (postId) router.push(`/item/${postId}`);
    } catch (e) {
      handleError(e);
    } finally {
      setIsWaiting(false);
    }
  }

  return (
    <div>
      <Header />
      <div className="px-20 py-4">
        <BackButton />
      </div>
      <main className="flex flex-col gap-8 px-20 pb-12">
        <div className="flex justify-between gap-4">
          <UploadFile onUpload={setImageUrl} />
          <WriteSection
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            price={price}
            onPriceChange={setPrice}
            onSubmit={isWaiting ? undefined : handleSubmit}
            isWaiting={isWaiting}
          />
          <Preview
            imageUrl={imageUrl}
            title={title}
            description={description}
            price={price}
          />
        </div>

        <PriceCardEditor plan={plan} onChange={setPlan} />
      </main>
      <Footer />
    </div>
  );
}
