"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import NormalCard from "@/src/components/NormalCard";
import { CiCamera } from "react-icons/ci";
import { useAuthStore } from "@/src/store/authStore";
import { useToast } from "@/src/hooks/useToast";
import { useHandleError } from "@/src/hooks/useHandleError";
import { uploadFile, toRelativeUrl } from "@/src/lib/file";
import {
  getMyProfile,
  updateMyProfile,
  getJobCategories,
  getSidoList,
  getSigunguList,
  type Profile,
  type JobCategory,
  type Sido,
  type Sigungu,
} from "@/src/lib/profile";
import { resetUsername, deleteAccount } from "@/src/lib/member";
import { getFavoritePosts, type Post } from "@/src/lib/post";

const DISTANCE_OPTIONS: { value: "TEN_KM" | "TWENTY_FIVE_KM" | "FIFTY_KM" | "OVER_HUNDRED_KM"; label: string }[] = [
  { value: "TEN_KM", label: "10km 이내" },
  { value: "TWENTY_FIVE_KM", label: "25km 이내" },
  { value: "FIFTY_KM", label: "50km 이내" },
  { value: "OVER_HUNDRED_KM", label: "100km 이상" },
];

export default function Page() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);
  const { addToast } = useToast();
  const handleError = useHandleError();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [jobCategoryId, setJobCategoryId] = useState<number | "">("");
  const [ctprvnCd, setCtprvnCd] = useState("");
  const [sigCd, setSigCd] = useState("");
  const [movableDistance, setMovableDistance] = useState<typeof DISTANCE_OPTIONS[number]["value"] | "">("");
  const [usernameInput, setUsernameInput] = useState("");

  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [sidoList, setSidoList] = useState<Sido[]>([]);
  const [sigunguList, setSigunguList] = useState<Sigungu[]>([]);

  const [favorites, setFavorites] = useState<Post[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getMyProfile(token);
      const data = res.data;
      setProfile(data);
      setImageUrl(data.imageUrl ?? "");
      setShortDescription(data.shortDescription ?? "");
      setJobCategoryId(data.jobCategoryId ?? "");
      setSigCd(data.sigCd ?? "");
      setMovableDistance((data.movableDistance as typeof movableDistance) ?? "");
      setUsernameInput(data.username ?? "");
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { router.push("/login/signin"); return; }
    fetchProfile();
    getJobCategories().then(setJobCategories).catch(() => {});
    getSidoList().then(setSidoList).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setFavoritesLoading(true);
    getFavoritePosts(token)
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setFavoritesLoading(false));
  }, [token]);

  useEffect(() => {
    if (!ctprvnCd) { setSigunguList([]); return; }
    getSigunguList(ctprvnCd).then(setSigunguList).catch(() => setSigunguList([]));
  }, [ctprvnCd]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      const { url } = await uploadFile(token, file);
      setImageUrl(url);
    } catch {
      addToast({ message: "이미지 업로드에 실패했습니다.", type: "error" });
    } finally {
      e.target.value = "";
    }
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      if (usernameInput.trim() && usernameInput.trim() !== profile?.username) {
        await resetUsername(token, usernameInput.trim());
      }
      await updateMyProfile(token, {
        imageUrl: imageUrl || undefined,
        sigCd: sigCd || undefined,
        movableDistance: movableDistance || undefined,
        shortDescription: shortDescription || undefined,
        jobCategoryId: jobCategoryId === "" ? undefined : Number(jobCategoryId),
      });
      addToast({ message: "프로필이 저장되었습니다.", type: "success" });
      setEditing(false);
      await fetchProfile();
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!token) return;
    if (!confirm("정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await deleteAccount(token);
      addToast({ message: "회원 탈퇴가 완료되었습니다.", type: "success" });
      clear();
      router.push("/main");
    } catch (e) {
      handleError(e);
    }
  }

  if (loading || !profile) {
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
      <main className="flex flex-col gap-10 px-20 py-10 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">프로필</h1>

        <div className="flex flex-col gap-6 border border-zinc-200 rounded-lg p-8">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-zinc-300 bg-zinc-100 shrink-0">
              <Image
                src={imageUrl ? toRelativeUrl(imageUrl) : "/profile.png"}
                alt="프로필 이미지"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
              {editing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <CiCamera className="text-white text-3xl" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold">{profile.username}</span>
              <span className="text-sm text-zinc-400">
                {profile.jobCategoryName || "직종 미설정"} · {profile.locationName || "활동 지역 미설정"}
              </span>
              {profile.movableDistanceLabel && (
                <span className="text-sm text-zinc-400">이동 가능 거리: {profile.movableDistanceLabel}</span>
              )}
            </div>
          </div>

          {!editing ? (
            <>
              <p className="text-zinc-600">{profile.shortDescription || "자기소개가 없습니다."}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-semibold hover:bg-zinc-100 cursor-pointer"
                >
                  프로필 수정
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">아이디</label>
                <input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">자기소개</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value.slice(0, 100))}
                  maxLength={100}
                  rows={3}
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main resize-none"
                />
                <span className="text-xs text-zinc-400 self-end">{shortDescription.length} / 100</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">직종</label>
                <select
                  value={jobCategoryId}
                  onChange={(e) => setJobCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main"
                >
                  <option value="">선택 안 함</option>
                  {jobCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-semibold text-zinc-600">시/도</label>
                  <select
                    value={ctprvnCd}
                    onChange={(e) => { setCtprvnCd(e.target.value); setSigCd(""); }}
                    className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main"
                  >
                    <option value="">선택</option>
                    {sidoList.map((s) => (
                      <option key={s.ctprvnCd} value={s.ctprvnCd}>{s.korName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-semibold text-zinc-600">시/군/구</label>
                  <select
                    value={sigCd}
                    onChange={(e) => setSigCd(e.target.value)}
                    disabled={!ctprvnCd}
                    className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main disabled:bg-zinc-100"
                  >
                    <option value="">선택</option>
                    {sigunguList.map((s) => (
                      <option key={s.sigCd} value={s.sigCd}>{s.korName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">이동 가능 거리</label>
                <select
                  value={movableDistance}
                  onChange={(e) => setMovableDistance(e.target.value as typeof movableDistance)}
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-main"
                >
                  <option value="">선택 안 함</option>
                  {DISTANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setEditing(false); fetchProfile(); }}
                  className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-semibold hover:bg-zinc-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-main text-white text-sm font-semibold hover:bg-main/90 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">찜한 목록</h2>
          {favoritesLoading ? (
            <p className="text-zinc-400 text-sm">불러오는 중...</p>
          ) : favorites.length === 0 ? (
            <p className="text-zinc-400 text-sm">찜한 항목이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {favorites.map((p) => (
                <NormalCard key={p.id} id={p.id} title={p.title} content={p.content} fileUrl={p.fileUrls?.[0]} />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDeleteAccount}
            className="text-sm text-red-500 underline hover:text-red-600 cursor-pointer"
          >
            회원 탈퇴
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
