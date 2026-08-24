"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/src/components/Header";
import BackButton from "@/src/components/BackButton";
import UploadFile from "@/src/components/write/UploadPicture";
import WriteSection from "@/src/components/write/WriteSection";
import Preview from "@/src/components/write/Preview";
import PriceCardEditor from "@/src/components/write/PriceCardEditor";
import { useAuthStore } from "@/src/store/authStore";
import { createPost, updatePost, getPost, getPostCategories, type PostCategory } from "@/src/lib/post";
import { useHandleError } from "@/src/hooks/useHandleError";
import { useToast } from "@/src/hooks/useToast";
import { type PriceCardPlan, DEFAULT_PLAN, parsePostContent, serializePostContent } from "@/src/types/priceCard";

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [plans, setPlans] = useState<PriceCardPlan[]>([DEFAULT_PLAN]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [loading, setLoading] = useState(!!postId);

  useEffect(() => { getPostCategories().then(setCategories).catch(handleError); }, []);

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
      setImageUrls(post.fileUrls ?? []);
      setCategoryId(post.category?.id ?? "");
      const { description: desc, plans: existingPlans } = parsePostContent(post.content ?? "");
      setDescription(desc ?? "");
      setPlans(existingPlans.length > 0 ? existingPlans : [DEFAULT_PLAN]);
      setPrice(existingPlans[0]?.price ?? "");
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
    if (categoryId === "") {
      addToast({ message: "카테고리를 선택해주세요.", type: "warning" });
      return;
    }
    if (imageUrls.length === 0) {
      addToast({ message: "사진을 업로드해주세요.", type: "warning" });
      return;
    }
    setIsWaiting(true);
    try {
      const effectivePlans = plans.map((p, i) => (i === 0 ? { ...p, price: price || p.price } : p));
      const content = serializePostContent(description, effectivePlans);
      if (postId) {
        await updatePost(token, { id: postId, title, content, fileUrls: imageUrls, categoryId });
        router.push(`/item/${postId}`);
      } else {
        const res = await createPost(token, { title, content, fileUrls: imageUrls, categoryId });
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
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="px-20 py-4">
        <BackButton />
      </div>
      <main className="flex gap-8 px-20 pb-12 items-start">
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          <div className="flex gap-8">
            <UploadFile initialImages={imageUrls} onUpload={setImageUrls} />
            <WriteSection
              title={title}
              onTitleChange={setTitle}
              description={description}
              onDescriptionChange={setDescription}
              price={price}
              onPriceChange={setPrice}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              categories={categories}
            />
          </div>
          <PriceCardEditor plans={plans} onChange={setPlans} />

          <button
            onClick={isWaiting ? undefined : handleSubmit}
            disabled={isWaiting}
            className="w-32 h-10 bg-main text-white rounded-lg font-bold self-end disabled:opacity-50 cursor-pointer"
          >
            {isWaiting ? "등록 중..." : "등록하기"}
          </button>
        </div>

        <div className="w-px self-stretch bg-zinc-300" />

        <Preview
          imageUrl={imageUrls[0]}
          title={title}
          description={description}
          price={price || plans[0]?.price}
        />
      </main>
    </div>
  );
}
