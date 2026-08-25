"use client";

import { useState, useEffect } from "react";
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
  // 불러오기를 끝낸 게시글 번호. 로딩 여부는 이 값으로 파생시킨다
  // (effect 안에서 동기적으로 setState 하지 않기 위함).
  const [loadedPostId, setLoadedPostId] = useState<number | null>(null);
  const loading = !!postId && loadedPostId !== postId;

  useEffect(() => { getPostCategories().then(setCategories).catch(handleError); }, []);

  // 수정 모드일 때 기존 게시글을 불러온다.
  // 응답이 늦게 도착한 뒤 다른 글로 이동한 경우를 대비해 취소 플래그를 둔다.
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    async function fetchExisting() {
      try {
        const res = await getPost(postId!, token);
        if (cancelled) return;
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
        if (cancelled) return;
        handleError(e);
        router.replace("/main");
      } finally {
        if (!cancelled) setLoadedPostId(postId);
      }
    }

    fetchExisting();
    return () => { cancelled = true; };
  }, [postId, token, myUsername]);

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
    if (title.length > 255) {
      addToast({ message: "제목은 255자 이하여야 합니다.", type: "warning" });
      return;
    }

    const effectivePlans = plans.map((p, i) => (i === 0 ? { ...p, price: price || p.price } : p));
    const content = serializePostContent(description, effectivePlans);
    // 서버가 본문을 2000자로 제한한다. 본문에는 플랜 정보까지 함께 직렬화되므로
    // 화면에 보이는 설명 글자 수보다 길어진다.
    if (content.length > 2000) {
      addToast({ message: "본문과 가격 정보가 너무 깁니다. 내용을 줄여주세요.", type: "warning" });
      return;
    }

    setIsWaiting(true);
    try {
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
