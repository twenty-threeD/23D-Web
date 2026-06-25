"use client"

import { useState, useEffect, useCallback, isValidElement, Children } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/src/components/Header"
import Footer from "@/src/components/Footer"
import CommunityMenu from "@/src/components/CommunitySideBar"
import Comment from "@/src/components/Comment"
import PostItem from "@/src/components/PostItem"
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io"
import { IoChatboxOutline } from "react-icons/io5"
import MDEditor from "@uiw/react-md-editor"
import Image from "next/image"
import {
  getPost,
  getPosts,
  getComments,
  createComment,
  addLike,
  removeLike,
} from "@/src/lib/community"
import { useAuthStore } from "@/src/store/authStore"
import TopButton from "@/src/components/TopButton"

interface Post {
  id: number
  username: string
  title: string
  content: string
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
  fileUrl?: string
  updatedAt: string
}

interface CommentData {
  id: number
  username: string
  content: string
  updatedAt: string
}

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const postId = Number(Array.isArray(params.id) ? params.id[0] : params.id)
  const token = useAuthStore((s) => s.accessToken)

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [relatedPosts, setRelatedPosts] = useState<PostListItem[]>([])
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
      const data = Array.isArray(res.data) ? res.data[0] : res.data
      setPost(data)
      setLikeCount(data?.likeCount ?? 0)
      setIsLiked(data?.isLiked ?? false)
    } catch {
      router.replace("/community")
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

  const fetchRelated = useCallback(async () => {
    try {
      const res = await getPosts(token)
      const list: PostListItem[] = res.data ?? []
      setRelatedPosts(list.filter((p) => p.id !== postId).slice(0, 4))
    } catch {
      setRelatedPosts([])
    }
  }, [postId, token])

  useEffect(() => {
    fetchPost()
    fetchComments()
    fetchRelated()
  }, [fetchPost, fetchComments, fetchRelated])

  async function handleLike() {
    if (!token) { router.push("/login/signin"); return }
    try {
      if (isLiked) {
        await removeLike(token, postId)
        setIsLiked(false)
        setLikeCount((c) => c - 1)
      } else {
        const res = await addLike(token, postId)
        if (res?.alreadyLiked) {
          setIsLiked(true)
          return
        }
        setIsLiked(true)
        setLikeCount((c) => c + 1)
      }
    } catch { /* ignore */ }
  }

  async function handleCommentSubmit() {
    if (!token) { router.push("/login/signin"); return }
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await createComment(token, postId, commentText)
      setCommentText("")
      await fetchComments()
    } catch { /* ignore */ } finally {
      setSubmitting(false)
    }
  }

  if (loading || !post) {
    return (
      <div>
        <Header />
        <p className="text-center py-20 text-zinc-400">불러오는 중...</p>
        <Footer />
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
      <Header />
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        <CommunityMenu />

        <main className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-4 w-full border-zinc-200 border rounded-lg p-8">
            {/* 헤더 */}
            <header className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-medium">{post.title}</h1>
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-zinc-300 shrink-0">
                  <Image src="/profile.png" alt="프로필사진" className="object-cover" width={48} height={48} />
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

            {/* 첨부 이미지 */}
            {post.fileUrl && (
              <img src={post.fileUrl} alt="첨부 이미지" className="max-w-full rounded-lg" />
            )}

            {/* 게시물 내용 */}
            <style>{`
              .wmde-markdown h1 { border-bottom: none !important; }
              .wmde-markdown h1 .anchor { display: none !important; }
            `}</style>
            <div data-color-mode="light" className="flex flex-col gap-8 py-2">
              <MDEditor.Markdown
                source={post.content}
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
                  content={c.content}
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
                    className="self-end px-4 py-2 bg-main text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {submitting ? "등록 중..." : "등록"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 관련 게시물 */}
          {relatedPosts.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">관련 게시물</h2>
              <div className="flex flex-col divide-y divide-zinc-300">
                {relatedPosts.map((p) => (
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
            </div>
          )}
        </main>
      </div>

      <TopButton />
      <Footer />
    </div>
  )
}
