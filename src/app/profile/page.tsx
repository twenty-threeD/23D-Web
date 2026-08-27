"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import NormalCard from "@/src/components/NormalCard";
import { CiCamera } from "react-icons/ci";
import { useAuthStore } from "@/src/store/authStore";
import { useProfileStore } from "@/src/store/profileStore";
import { useToast } from "@/src/hooks/useToast";
import { useHandleError } from "@/src/hooks/useHandleError";
import { uploadFile, toRelativeUrl } from "@/src/lib/file";
import { isPayloadTooLarge } from "@/src/lib/apiError";
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
import AccountEditModal from "@/src/components/profile/AccountEditModal";
import { getFavoritePosts, getMyPosts, deletePost, type Post } from "@/src/lib/post";

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
  const myUsername = useAuthStore((s) => s.username);
  const { addToast } = useToast();
  const handleError = useHandleError();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<"email" | "phone" | null>(null);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getMyProfile(token);
      const data = res.data;
      setProfile(data);
      setImageUrl(data.imageUrl ?? "");
      useProfileStore.getState().setImageUrl(data.imageUrl ?? null);
      setShortDescription(data.shortDescription ?? "");
      setJobCategoryId(data.jobCategoryId ?? "");
      setSigCd(data.sigCd ?? "");
      setMovableDistance((data.movableDistance as typeof movableDistance) ?? "");
      setUsernameInput(data.username ?? "");
      // 프로필 응답에 posts 가 없으면 전체 목록을 훑어 걸러낸다
      if (data.posts) {
        setMyPosts(data.posts);
      } else {
        const name = data.username ?? myUsername;
        if (name) {
          setMyPosts(await getMyPosts(token, name).catch(() => []));
        } else {
          setMyPosts([]);
        }
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [token, myUsername]);

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

  async function handleDeletePost(postId: number) {
    if (!token) return;
    if (!confirm("이 게시글을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    setDeletingId(postId);
    try {
      await deletePost(token, postId);
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      addToast({ message: "게시글을 삭제했습니다.", type: "success" });
    } catch (e) {
      handleError(e);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!ctprvnCd) { setSigunguList([]); return; }
    getSigunguList(ctprvnCd).then(setSigunguList).catch(() => setSigunguList([]));
  }, [ctprvnCd]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (file.size > 25 * 1024 * 1024) {
      addToast({ message: "사진은 최대 25MB까지 업로드할 수 있어요.", type: "error" });
      e.target.value = "";
      return;
    }
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setUploadingImage(true);
    try {
      const { url } = await uploadFile(token, file);
      setImageUrl(url);
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 25MB까지 업로드할 수 있어요." : "이미지 업로드에 실패했습니다.",
        type: "error",
      });
    } finally {
      URL.revokeObjectURL(preview);
      setImagePreview(null);
      setUploadingImage(false);
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
      useProfileStore.getState().reset();
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
      <main className="flex flex-col gap-10 px-20 py-10 mx-auto">
        <h1 className="text-2xl font-bold">프로필</h1>

        <div className="flex flex-col gap-6 border border-zinc-200 rounded-lg p-8">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-zinc-300 bg-zinc-100 shrink-0">
              <Image
                src={imagePreview ?? (imageUrl ? toRelativeUrl(imageUrl) : "/profile.png")}
                alt="프로필 이미지"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized={!!imagePreview}
              />
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
              {editing && !uploadingImage && (
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
                  className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">자기소개</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value.slice(0, 100))}
                  maxLength={100}
                  rows={3}
                  className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 resize-none"
                />
                <span className="text-xs text-zinc-400 self-end">{shortDescription.length} / 100</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">직종</label>
                <select
                  value={jobCategoryId}
                  onChange={(e) => setJobCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
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
                    className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
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
                    className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
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
                  className="border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500"
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
                  className="px-4 py-2 rounded-xl bg-main text-white text-sm font-semibold transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 계정 정보 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">계정 정보</h2>
          <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-500">이메일</span>
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {profile?.email ?? <span className="text-zinc-400">등록된 정보가 없습니다</span>}
                </span>
                <button
                  onClick={() => setEditingField("email")}
                  className="text-xs text-zinc-500 underline underline-offset-2 hover:text-main transition-colors cursor-pointer"
                >
                  변경
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-500">전화번호</span>
              <div className="flex items-center gap-3">
                {profile?.phone && (
                  profile.phoneVerified ? (
                    <span className="text-xs text-main border border-main rounded-full px-2 py-0.5">인증됨</span>
                  ) : (
                    <button
                      onClick={() => setVerifyingPhone(true)}
                      className="text-xs text-white bg-main rounded-full px-2 py-0.5 hover:bg-orange-600 transition-colors cursor-pointer"
                    >
                      인증하기
                    </button>
                  )
                )}
                <span className="text-sm">
                  {profile?.phone ?? <span className="text-zinc-400">등록된 정보가 없습니다</span>}
                </span>
                <button
                  onClick={() => setEditingField("phone")}
                  className="text-xs text-zinc-500 underline underline-offset-2 hover:text-main transition-colors cursor-pointer"
                >
                  변경
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 내가 올린 게시글 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">내가 올린 게시글</h2>
          {loading ? (
            <p className="text-zinc-400 text-sm">불러오는 중...</p>
          ) : myPosts.length === 0 ? (
            <p className="text-zinc-400 text-sm">등록한 게시글이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {myPosts.map((p) => (
                <div key={p.id} className="flex flex-col">
                  <NormalCard id={p.id} title={p.title} content={p.content} fileUrl={p.fileUrls?.[0]} />
                  <div className="flex gap-2 px-3">
                    <button
                      onClick={() => router.push(`/upload/${p.id}`)}
                      className="flex-1 py-1.5 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-600 hover:border-main hover:text-main transition-colors cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(p.id)}
                      disabled={deletingId === p.id}
                      className="flex-1 py-1.5 rounded-lg border border-zinc-300 text-xs font-semibold text-red-500 hover:border-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {deletingId === p.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              ))}
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
                <NormalCard key={p.id} id={p.id} title={p.title} content={p.content} fileUrl={p.fileUrls?.[0]} category={p.category} />
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
      {verifyingPhone && token && profile?.phone && (
        <AccountEditModal
          field="phone"
          token={token}
          verifyOnlyPhone={profile.phone}
          onClose={() => setVerifyingPhone(false)}
          onDone={() => { setVerifyingPhone(false); fetchProfile(); }}
        />
      )}

      {editingField && token && (
        <AccountEditModal
          field={editingField}
          token={token}
          onClose={() => setEditingField(null)}
          onDone={() => { setEditingField(null); fetchProfile(); }}
        />
      )}
      <Footer />
    </div>
  );
}
