"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import BackButton from "@/src/components/BackButton";
import UploadFile from "@/src/components/write/UploadPicture";
import WriteSection from "@/src/components/write/WriteSection";
import Preview from "@/src/components/write/Preview";
import PriceCardEditor from "@/src/components/write/PriceCardEditor";
import { useAuthStore } from "@/src/store/authStore";
import { createPost, updatePost, getPost } from "@/src/lib/post";
import { useHandleError } from "@/src/hooks/useHandleError";
import { useToast } from "@/src/hooks/useToast";
import { type PriceCardPlan } from "@/src/types/priceCard";

const DEFAULT_PLAN: PriceCardPlan = {
  planName: "",
  price: "",
  description: "",
  items: [],
}

function parsePlan(content: string): { description: string; plan?: PriceCardPlan } {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object" && "description" in parsed) return parsed
  } catch {}
  return { description: content }
}

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const token = useAuthStore((s) => s.accessToken);
  const myUsername = useAuthStore((s) => s.username);
  const handleError = useHandleError();
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [plan, setPlan] = useState<PriceCardPlan>(DEFAULT_PLAN);
  const [isWaiting, setIsWaiting] = useState(false);
  const [loading, setLoading] = useState(!!postId);

  const fetchExisting = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await getPost(postId, token);
      const post = res.data;
      if (post.member?.username && myUsername && post.member.username !== myUsername) {
        router.replace(`/item/${postId}`);
        return;
      }
      setTitle(post.title ?? "");
      setImageUrl(post.fileUrls?.[0] ?? "");
      const { description: desc, plan: existingPlan } = parsePlan(post.content ?? "");
      setDescription(desc ?? "");
      if (existingPlan) { setPlan(existingPlan); setPrice(existingPlan.price ?? ""); }
    } catch (e) {
      handleError(e);
      router.replace("/main");
    } finally {
      setLoading(false);
    }
  }, [postId, token, myUsername]);

  useEffect(() => { fetchExisting(); }, [fetchExisting]);

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
      if (postId) {
        await updatePost(token, { id: postId, title, content, fileUrl: imageUrl || undefined });
        router.push(`/item/${postId}`);
      } else {
        const res = await createPost(token, { title, content, fileUrl: imageUrl || undefined });
        const newId = res.data?.id;
        if (newId) router.push(`/item/${newId}`);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setIsWaiting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Header />
        <p className="text-center py-20 text-zinc-400">불러오는 중...</p>
        <Footer />
      </div>
    );
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
