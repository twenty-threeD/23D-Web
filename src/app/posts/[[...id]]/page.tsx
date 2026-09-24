"use client"

import { useState, useEffect, useCallback, isValidElement, Children } from "react"
import { useParams, useRouter } from "next/navigation"
import CommunityMenu from "@/src/components/CommunitySideBar"
import Comment from "@/src/components/Comment"
import PostItem from "@/src/components/PostItem"
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io"
import { IoChatboxOutline } from "react-icons/io5"
import MDEditor from "@uiw/react-md-editor"
import Image from "next/image"
import {
  getPost,
  getPostsByCategory,
  isCommunityCategory,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  addLike,
  removeLike,
  deletePost,
  canViewPost,
  filterByRegion,
  parseRegion,
  sortByLatest,
  communityListHref,
  fetchAllPages,
  COMMUNITY_PAGE_SIZE,
} from "@/src/lib/community"
import CommunityPagination from "@/src/components/CommunityPagination"
import { useMyLocation } from "@/src/hooks/useMyLocation"
import { useAuthStore } from "@/src/store/authStore"
import { toRelativeUrl } from "@/src/lib/file"
import { useLikeStore } from "@/src/store/likeStore"
import { ApiError } from "@/src/lib/apiError"
import { useHandleError } from "@/src/hooks/useHandleError"
import TopButton from "@/src/components/TopButton"
import { signinPath } from "@/src/lib/navigation"

interface Post {
  id: number
  username: string
  // 프로필 미설정 회원은 null 로 온다
  imageUrl?: string | null
  title: string
  content: string
  category?: string
  fileUrl?: string
  viewCount: number
  likeCount: number
  commentCount: number
  updatedAt: string
  edited: boolean
  isLiked?: boolean
}

interface PostListItem {
  id: number
  username: string
  title: string
  content: string
  category?: string
  fileUrl?: string
  updatedAt: string
}

interface CommentData {
  id: number
  username: string
  content: string
  updatedAt: string
  edited?: boolean
  imageUrl?: string | null
}

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const postId = Number(Array.isArray(params.id) ? params.id[0] : params.id)
  const token = useAuthStore((s) => s.accessToken)
  const myUsername = useAuthStore((s) => {
    if (s.username) return s.username
    if (!s.accessToken) return null
    try {
      const p = JSON.parse(atob(s.accessToken.split('.')[1]))
      return p.username ?? p.sub ?? null
    } catch { return null }
  })

  const handleError = useHandleError()
  const { location, loaded: locationLoaded } = useMyLocation()
  const myCtprvnCd = location?.ctprvnCd ?? null
  // 커뮤니티 응답에 작성자 이미지가 없어 서비스 게시글에서 모아둔 매핑으로 채운다
  const likeStore = useLikeStore()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [relatedPosts, setRelatedPosts] = useState<PostListItem[]>([])
  const [relatedPage, setRelatedPage] = useState(1)
  const [commentText, setCommentText] = useState("")
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [likeCount, setLikeCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPost = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const res = await getPost(postId, token)
      const data = Array.isArray(res.data)
        ? (res.data.find((p: Post) => p.id === postId) ?? res.data[0])
        : res.data
      setPost(data)
      setLikeCount(data?.likeCount ?? 0)
      setIsLiked(data?.isLiked ?? likeStore.isLiked(postId))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) router.replace("/community")
    } finally {
      setLoading(false)
    }
  }, [postId, token, router])

  const fetchComments = useCallback(async () => {
    if (!postId) return
    try {
      const res = await getComments(postId, token)
      setComments(res.data ?? [])
    } catch {
      setComments([])
    }
  }, [postId, token])

  // 관련 게시물은 목록과 같은 기준(최신순·페이지 크기)으로 자른, 지금 글이 속한 페이지를 보여준다.
  // 페이지 번호를 누르면 글 밖으로 나가 목록의 그 페이지로 가므로, 번호가 목록과 맞도록
  // 자르는 건 지금 글을 포함한 목록 기준으로 하고 화면에서만 지금 글을 뺀다.
  // 카테고리를 알려면 본문 응답이 먼저 와야 한다
  const postCategory = post?.category ?? null
  const fetchRelated = useCallback(async () => {
    if (!isCommunityCategory(postCategory)) { setRelatedPosts([]); return }
    try {
      // 지금 글이 몇 번째 페이지인지 알아야 해서 서버 페이징을 쓰지 않고 카테고리 전체를 받는다
      const all = await fetchAllPages<PostListItem>((p, size) => getPostsByCategory(postCategory, token, p, size))
      const list = sortByLatest(filterByRegion(all, myCtprvnCd, myUsername))
      const index = list.findIndex((p) => p.id === postId)
      setRelatedPage(index === -1 ? 1 : Math.floor(index / COMMUNITY_PAGE_SIZE) + 1)
      setRelatedPosts(list)
    } catch {
      setRelatedPosts([])
      setRelatedPage(1)
    }
  }, [postId, postCategory, token, myCtprvnCd, myUsername])

  useEffect(() => {
    if (!locationLoaded) return
    fetchPost()
    fetchComments()
  }, [fetchPost, fetchComments, locationLoaded])

  useEffect(() => {
    if (!locationLoaded) return
    fetchRelated()
  }, [fetchRelated, locationLoaded])

  async function handleLike() {
    if (!token) { router.push(signinPath()); return }
    try {
      if (isLiked) {
        await removeLike(token, postId)
        setIsLiked(false)
        setLikeCount((c) => c - 1)
        likeStore.unlike(postId)
      } else {
        const res = await addLike(token, postId)
        if (res?.alreadyLiked) { setIsLiked(true); likeStore.like(postId); return }
        setIsLiked(true)
        setLikeCount((c) => c + 1)
        likeStore.like(postId)
      }
    } catch (e) { handleError(e) }
  }

  async function handleDelete() {
    if (!token) return
    if (!confirm("게시글을 삭제하시겠습니까?")) return
    try {
      await deletePost(token, postId)
      router.push("/community")
    } catch (e) {
      handleError(e)
    }
  }

  async function handleCommentEdit(commentId: number, content: string) {
    if (!token) return
    try {
      await updateComment(token, commentId, content)
      await fetchComments()
    } catch (e) {
      handleError(e)
    }
  }

  async function handleCommentDelete(commentId: number) {
    if (!token) return
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    try {
      await deleteComment(token, commentId)
      await fetchComments()
    } catch (e) {
      handleError(e)
    }
  }

  async function handleCommentSubmit() {
    if (!token) { router.push(signinPath()); return }
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await createComment(token, postId, commentText)
      setCommentText("")
      await fetchComments()
    } catch (e) {
      handleError(e)
    } finally {
      setSubmitting(false)
    }
  }

  // 주소로 직접 들어와도 다른 시·도의 동네 주민 글은 내용을 보여주지 않는다
  if (!loading && post && !canViewPost(post, myCtprvnCd, myUsername)) {
    return (
      <div>
        <p className="text-center py-20 text-zinc-400">
          {location ? "같은 지역 주민만 볼 수 있는 글입니다." : "프로필에서 지역을 설정하면 같은 지역 주민의 글을 볼 수 있습니다."}
        </p>
      </div>
    )
  }

  const relatedTotalPages = Math.max(1, Math.ceil(relatedPosts.length / COMMUNITY_PAGE_SIZE))
  const relatedPagePosts = relatedPosts
    .slice((relatedPage - 1) * COMMUNITY_PAGE_SIZE, relatedPage * COMMUNITY_PAGE_SIZE)
    .filter((p) => p.id !== postId)

  if (loading || !post) {
    return (
      <div>
        <p className="text-center py-20 text-zinc-400">불러오는 중...</p>
      </div>
    )
  }

  const dateStr = post.updatedAt
    ? new Date(post.updatedAt).toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      })
    : ""

  return (
    <div>
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        <CommunityMenu />

        <main className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-4 w-full border-zinc-200 border rounded-lg p-8">
            {/* 헤더 */}
            <header className="flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-medium">{post.title}</h1>
                {myUsername === post.username && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/community/write/${postId}`)}
                      className="px-3 py-1 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 text-sm text-red-500 border border-red-300 rounded-lg hover:bg-red-50 cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-zinc-300 shrink-0">
                  <Image src={post.imageUrl ? toRelativeUrl(post.imageUrl) : "/profile.png"} alt="프로필사진" className="object-cover" width={48} height={48} />
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h3 className="text-sm font-medium">{post.username}</h3>
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <span className="text-sm font-medium text-zinc-400">{dateStr}</span>
                      <span className="text-sm font-medium text-zinc-400">조회 {(post.viewCount ?? 0).toLocaleString()}</span>
                      {post.edited && <span className="text-xs text-zinc-400">(수정됨)</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <IoChatboxOutline className="text-xl" />
                      <span className="text-zinc-500 text-sm font-semibold">댓글</span>
                      <p className="text-sm font-semibold">{post.commentCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <hr className="text-zinc-300" />

            {/* 게시물 내용 */}
            <style>{`
              .wmde-markdown h1 { border-bottom: none !important; }
              .wmde-markdown h1 .anchor { display: none !important; }
            `}</style>
            <div data-color-mode="light" className="flex flex-col gap-8 py-2">
              <MDEditor.Markdown
                source={parseRegion(post.content).body}
                components={{
                  p: ({ children }) => {
                    const childArray = Children.toArray(children)
                    const imgs = childArray.filter(c => isValidElement(c) && c.type === 'img')
                    const texts = childArray.filter(c => !(isValidElement(c) && c.type === 'img'))
                    return (
                      <>
                        {texts.length > 0 && <p>{texts}</p>}
                        {imgs.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {imgs.map((img, i) => (
                              <div key={i} className="w-60 rounded-lg overflow-hidden [&_img]:w-full [&_img]:h-auto">
                                {img}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  },
                }}
              />
              <div className="flex gap-4">
                <button onClick={handleLike} className="flex items-center gap-1 cursor-pointer">
                  {isLiked
                    ? <IoMdHeart className="text-2xl text-main" />
                    : <IoMdHeartEmpty className="text-2xl text-main" />
                  }
                  <span className="text-zinc-500 text-sm font-semibold">좋아요</span>
                  <p className="text-sm font-semibold">{likeCount}</p>
                </button>
                <div className="flex items-center gap-1">
                  <IoChatboxOutline className="text-xl" />
                  <span className="text-zinc-500 text-sm font-semibold">댓글</span>
                  <p className="text-sm font-semibold">{comments.length}</p>
                </div>
              </div>
            </div>

            <hr className="text-zinc-300" />

            {/* 댓글 목록 */}
            <div className="flex flex-col gap-2 divide-zinc-200 divide-y">
              {comments.map((c) => (
                <Comment
                  key={c.id}
                  authorName={c.username}
                  profileImage={c.imageUrl ? toRelativeUrl(c.imageUrl) : undefined}
                  content={c.content}
                  edited={c.edited}
                  isOwner={myUsername === c.username}
                  onEdit={(content) => handleCommentEdit(c.id, content)}
                  onDelete={() => handleCommentDelete(c.id)}
                  createdAt={new Date(c.updatedAt).toLocaleString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                />
              ))}
              {/* 댓글 달기 */}
              <div className="flex items-start gap-4 pt-4">
                <div className="flex flex-col gap-2 w-full p-6 border border-zinc-300 rounded-lg">
                  <h3 className="text-md font-bold">
                    {token ? "댓글 작성" : "로그인 후 댓글을 작성할 수 있습니다"}
                  </h3>
                  <textarea
                    placeholder="댓글을 입력하세요..."
                    className="w-full h-24 focus:outline-none resize-none"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!token}
                  />
                  <button
                    onClick={handleCommentSubmit}
                    disabled={submitting || !token}
                    className="self-end px-4 py-2 bg-main text-white text-sm font-semibold rounded-xl transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? "등록 중..." : "등록"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 관련 게시물 */}
          {(relatedPagePosts.length > 0 || relatedTotalPages > 1) && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">관련 게시물</h2>
              <div className="flex flex-col divide-y divide-zinc-300">
                {relatedPagePosts.map((p) => (
                  <PostItem
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    content={p.content}
                    imageUrl={p.fileUrl}
                    createdAt={new Date(p.updatedAt).toLocaleDateString("ko-KR")}
                  />
                ))}
              </div>
              <CommunityPagination
                page={relatedPage}
                totalPages={relatedTotalPages}
                hrefFor={(p) => communityListHref(isCommunityCategory(postCategory) ? postCategory : null, p)}
              />
            </div>
          )}
        </main>
      </div>

      <TopButton />
    </div>
  )
}
