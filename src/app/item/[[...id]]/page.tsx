"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import Banner from "@/src/components/Banner";
import Portfolio from "@/src/components/Portfolio";
import PriceCard from "@/src/components/PriceCard";
import DoButton from "@/src/components/DoButton";
import Review from "@/src/components/Review";
import StarRating from "@/src/components/StarRating";
import NormalCard from "@/src/components/NormalCard";
import TopButton from "@/src/components/TopButton";
import { FaStar } from "react-icons/fa";
import { getPost, getPosts, type Post } from "@/src/lib/post"
import { type PriceCardPlan } from "@/src/types/priceCard";

function parsePlan(content: string): { description: string; plan?: PriceCardPlan } {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object" && "description" in parsed) return parsed
  } catch {}
  return { description: content }
}

export default function Page() {
  const params = useParams();
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const reviewCount = 24;
  const review = 4.5;
  const [isExpanded, setIsExpanded] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    getPost(postId)
      .then((res) => setPost(res.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    getPosts().then((list) => setRelatedPosts(list)).catch(() => {});
  }, []);

  const { description, plan } = post ? parsePlan(post.content) : { description: "" };

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
      <Banner />
      <div className="flex flex-col px-20 py-8 gap-16">
        <div className="flex gap-16 justify-between items-start">
          {/* left content */}
          <div className="flex flex-1 flex-col gap-6 min-w-0">
            {/* 프로필 */}
            <div className="flex flex-col p-5 border border-zinc-300 rounded-lg gap-8 items-center justify-center">

              <div className="w-full flex items-start justify-between min-w-0">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-300" />
                  <div className="flex flex-col justify-between py-1">
                    <span className="font-bold text-xl">{post?.username ?? "오늘의 에어컨"}</span>
                    <span className="text-sm text-zinc-400">{post?.title ?? "전문가의 꼼꼼한 시공"}</span>
                  </div>
                </div>
                <span className="text-sm text-zinc-600">설치/수리 &gt; 에어컨 대구광역시 / 50km 이동가능</span>
              </div>

              <div className="flex w-full py-4 items-center justify-between">
                <div className="w-1/3 flex flex-col gap-2 text-center">
                  <span className="text-sm text-zinc-400">총 거래 건수</span>
                  <h3 className="text-2xl font-semibold">24건</h3>
                </div>
                <div className="w-1/3 flex flex-col gap-2 text-center border-x border-zinc-300">
                  <span className="text-sm text-zinc-400">리뷰</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <FaStar className="text-main size-5"/>
                    <h3 className="text-2xl font-semibold">{review}</h3>
                    <span className="text-sm text-zinc-500">({reviewCount})</span>
                  </div>
                </div>
                <div className="w-1/3 flex flex-col gap-2 text-center">
                  <span className="text-sm text-zinc-400">경력</span>
                  <h3 className="text-2xl font-semibold">13년</h3>
                </div>
              </div>
            </div>

            {/* 포트폴리오 */}
            <div className="flex justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold">포트폴리오</h2>
                <span className="text-md text-zinc-400">(24)</span>
              </div>
              <button className="text-md text-zinc-400">전체 보기</button>
            </div>
            {post?.fileUrls && post.fileUrls.length > 0 ? (
              <div className="w-full flex gap-4">
                {post.fileUrls.map((url, i) => (
                  <div key={i} className="w-48 h-48 rounded-lg overflow-hidden bg-zinc-200">
                    <img src={url} alt={`포트폴리오 ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex gap-4">
                <Portfolio />
                <Portfolio />
                <Portfolio />
                <Portfolio />
              </div>
            )}

            {/* 상세 설명 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">서비스 설명</h2>
              <p
                className={`${isExpanded
                  ? "text-zinc-500"
                  : "line-clamp-10 bg-linear-to-b from-zinc-500 via-zinc-300 to-white bg-clip-text text-transparent"
                }`}
              >
                {description || "서비스 설명이 없습니다."}
              </p>
              <DoButton onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? "접기" : "더보기"}
              </DoButton>
            </div>

            {/* 리뷰 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">리뷰 {reviewCount}개</h2>
              <div className="flex gap-2 w-full px-4 py-10 border border-zinc-300 rounded-lg items-center">
                <StarRating rating={review} />
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-semibold">{review}</p>
                  <span className="text-sm text-zinc-500">({reviewCount})</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Review />
                <Review />
                <Review />
              </div>
            </div>
          </div>

          {/* right content */}
          <div className="flex flex-col gap-4">
            <div className="w-100 shrink-0">
              <PriceCard username={post?.username} plan={plan} />
            </div>
            <div className="bg-zinc-100 p-4 rounded-lg">
              <ul className="flex flex-col gap-1 list-disc list-inside">
                <li className="text-zinc-400 text-xs font-semibold">서비스 이후 금액이 전달 되니 안전하게 거래하세요.</li>
                <li className="text-zinc-400 text-xs font-semibold">견적서와 계약서는 블록체인을 통해 평생 안전히 보관됩니다.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold shrink-0">이웃들이<br/>많이 찾아요</h2>
          <div className="flex gap-4">
            {relatedPosts.slice(0, 4).map((p) => (
              <NormalCard key={p.id} id={p.id} title={p.title} content={p.content} fileUrl={p.fileUrls?.[0]} />
            ))}
          </div>
        </div>

        <div className="w-full flex gap-8 justify-between">
          <h2 className="text-2xl font-bold shrink-0">재방문율이<br/>높아요</h2>
          <div className="flex gap-4">
            {relatedPosts.slice(4, 8).map((p) => (
              <NormalCard key={p.id} id={p.id} title={p.title} content={p.content} fileUrl={p.fileUrls?.[0]} />
            ))}
          </div>
        </div>
      </div>
      <TopButton />
      <Footer />
    </div>
  );
}
