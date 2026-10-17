"use client"

import { useState, useEffect, useCallback, useRef, isValidElement, Children } from "react"
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
  type CommunityComment,
  COMMUNITY_PAGE_SIZE,
} from "@/src/lib/community"
import CommunityPagination from "@/src/components/CommunityPagination"
import { useMyLocation } from "@/src/hooks/useMyLocation"
import { useInfiniteScroll } from "@/src/hooks/useInfiniteScroll"
import { useAuthStore, decodeJwtUsername } from "@/src/store/authStore"
import { toRelativeUrl } from "@/src/lib/file"
import { useLikeStore } from "@/src/store/likeStore"
import { ApiError } from "@/src/lib/apiError"
import { useHandleError } from "@/src/hooks/useHandleError"
import TopButton from "@/src/components/TopButton"
import { signinPath } from "@/src/lib/navigation"
import { PAGE_PADDING } from "@/src/lib/layout";

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

const COMMENT_PAGE_SIZE = 20

// 답글 입력창은 원댓글 아래 하나만 연다. 답글의 답글도 같은 원댓글에 붙으므로 원댓글 id 만 들고 있으면 된다
interface ReplyTarget {
  parentId: number
  text: string
}

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const postId = Number(Array.isArray(params.id) ? params.id[0] : params.id)
  const token = useAuthStore((s) => s.accessToken)
  const hydrated = useAuthStore((s) => s.hydrated)
  const myUsername = useAuthStore((s) => s.username ?? (s.accessToken ? decodeJwtUsername(s.accessToken) : null))

  const handleError = useHandleError()
  const { location, loaded: locationLoaded } = useMyLocation()
  const myCtprvnCd = location?.ctprvnCd ?? null
  // 커뮤니티 응답에 작성자 이미지가 없어 서비스 게시글에서 모아둔 매핑으로 채운다
  const likeStore = useLikeStore()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentsLast, setCommentsLast] = useState(true)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null)
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

  // 작성·수정·삭제 뒤 다시 받을 때 첫 페이지만 받으면 펼쳐 둔 댓글이 접혀 스크롤이 튄다.
  // 지금까지 펼친 페이지 수만큼 다시 받아 같은 범위를 유지한다
  const loadedCommentPagesRef = useRef(1)
  const loadingMoreCommentsRef = useRef(false)

  const fetchComments = useCallback(async () => {
    if (!postId) return
    try {
      const list: CommunityComment[] = []
      let last = true
      for (let page = 0; page < loadedCommentPagesRef.current; page++) {
        const res = await getComments(postId, token, page, COMMENT_PAGE_SIZE)
        list.push(...res.content)
        last = res.last
        if (last) break
      }
      setComments(list)
      setCommentsLast(last)
    } catch {
      setComments([])
      setCommentsLast(true)
    }
  }, [postId, token])

  async function loadMoreComments() {
    if (loadingMoreCommentsRef.current || commentsLast) return
    loadingMoreCommentsRef.current = true
    setLoadingMoreComments(true)
    try {
      const res = await getComments(postId, token, loadedCommentPagesRef.current, COMMENT_PAGE_SIZE)
      loadedCommentPagesRef.current += 1
      // 다음 페이지를 받는 사이 새 댓글이 앞 페이지로 밀려 들어오면 같은 댓글이 두 번 올 수 있다
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        return [...prev, ...res.content.filter((c) => !seen.has(c.id))]
      })
      setCommentsLast(res.last)
    } catch {
      // 실패한 채로 두면 끝 표시가 계속 보여 같은 요청을 끝없이 반복하므로 더 부르지 않는다
      setCommentsLast(true)
    } finally {
      loadingMoreCommentsRef.current = false
      setLoadingMoreComments(false)
    }
  }

  const commentSentinelRef = useInfiniteScroll({
    enabled: !commentsLast,
    itemCount: comments.length,
    onLoadMore: loadMoreComments,
  })

  // 댓글 수는 답글까지 센 게시글의 commentCount 를 쓴다. 본문을 다시 그리지 않도록 수만 갱신한다
  const refreshCommentCount = useCallback(async () => {
    try {
      const res = await getPost(postId, token)
      const data: Post | undefined = Array.isArray(res.data) ? res.data.find((p: Post) => p.id === postId) : res.data
      if (data) setPost((prev) => (prev ? { ...prev, commentCount: data.commentCount } : prev))
    } catch {
      // 수가 잠시 어긋날 뿐이라 화면을 막지 않는다
    }
  }, [postId, token])

  const refreshAfterCommentChange = useCallback(
    () => Promise.all([fetchComments(), refreshCommentCount()]),
    [fetchComments, refreshCommentCount],
  )

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

  // 서버는 토큰 없는 요청을 익명 조회로 보고 조회수를 세지 않는다.
  // persist 가 localStorage 의 토큰을 되살리기 전에 부르면 로그인 사용자도 익명으로 잡히므로 복원을 기다린다
  useEffect(() => {
    if (!locationLoaded || !hydrated) return
    // 다른 글로 넘어오면 이전 글에서 펼친 페이지 수를 이어받지 않는다.
    // 답글 입력창은 댓글 id 가 글마다 달라 새 글의 어느 댓글에도 열리지 않으므로 따로 닫지 않는다
    loadedCommentPagesRef.current = 1
    fetchPost()
    fetchComments()
  }, [fetchPost, fetchComments, locationLoaded, hydrated])

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
      await refreshAfterCommentChange()
    } catch (e) {
      handleError(e)
    }
  }

  async function handleCommentDelete(commentId: number) {
    if (!token) return
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    try {
      await deleteComment(token, commentId)
      await refreshAfterCommentChange()
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
      await refreshAfterCommentChange()
    } catch (e) {
      handleError(e)
    } finally {
      setSubmitting(false)
    }
  }

  function openReply(parentId: number, mention?: string) {
    if (!token) { router.push(signinPath()); return }
    // 답글에 답할 때는 누구에게 한 말인지 보이도록 작성자를 멘션해 둔다
    setReplyTarget({ parentId, text: mention ? `@${mention} ` : "" })
  }

  async function handleReplySubmit() {
    if (!token || !replyTarget || !replyTarget.text.trim()) return
    setSubmitting(true)
    try {
      await createComment(token, postId, replyTarget.text, replyTarget.parentId)
      setReplyTarget(null)
      await refreshAfterCommentChange()
    } catch (e) {
      handleError(e)
    } finally {
      setSubmitting(false)
    }
  }

  function formatCommentDate(value: string) {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  }

  function renderComment(c: CommunityComment, rootId: number) {
    return (
      <Comment
        key={c.id}
        authorName={c.username}
        profileImage={c.imageUrl ? toRelativeUrl(c.imageUrl) : undefined}
        content={c.content}
        edited={c.isEdited}
        deleted={c.isDeleted}
        isOwner={myUsername === c.username}
        // 답글의 답글도 원댓글에 붙여야 서버가 받는다
        onReply={() => openReply(rootId, c.parentId ? c.username : undefined)}
        onEdit={(content) => handleCommentEdit(c.id, content)}
        onDelete={() => handleCommentDelete(c.id)}
        createdAt={formatCommentDate(c.createdAt)}
      />
    )
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
      <div className={`flex flex-col md:flex-row md:items-start justify-between ${PAGE_PADDING} gap-6 md:gap-8`}>
        <CommunityMenu />

        <main className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-4 w-full border-line border rounded-lg p-5 md:p-8">
            {/* 헤더 */}
            <header className="flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-medium">{post.title}</h1>
                {myUsername === post.username && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/community/write/${postId}`)}
                      className="px-3 py-1 text-sm text-zinc-600 border border-line rounded-lg hover:bg-zinc-50 cursor-pointer"
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
                <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-line shrink-0">
                  <Image src={post.imageUrl ? toRelativeUrl(post.imageUrl) : "/profile.webp"} alt="프로필사진" className="object-cover" width={48} height={48} />
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h3 className="text-sm font-medium">{post.username}</h3>
                  {/* 휴대폰 폭에서는 날짜·조회수·댓글 수가 한 줄에 다 들어가지 않아 항목 단위로 줄을 바꾼다 */}
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 whitespace-nowrap">
                      <span className="text-sm font-medium text-zinc-400">{dateStr}</span>
                      <span className="text-sm font-medium text-zinc-400">조회 {(post.viewCount ?? 0).toLocaleString()}</span>
                      {post.edited && <span className="text-xs text-zinc-400">(수정됨)</span>}
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap">
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
                  <p className="text-sm font-semibold">{post.commentCount ?? 0}</p>
                </div>
              </div>
            </div>

            <hr className="text-zinc-300" />

            {/* 댓글 목록 */}
            <div className="flex flex-col gap-2 divide-line divide-y">
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col">
                  {renderComment(c, c.id)}
                  {(c.replies.length > 0 || replyTarget?.parentId === c.id) && (
                    <div className="flex flex-col pl-14">
                      {c.replies.map((r) => renderComment(r, c.id))}
                      {replyTarget?.parentId === c.id && (
                        <div className="flex flex-col gap-2 p-4 border border-line rounded-lg">
                          <textarea
                            autoFocus
                            placeholder="답글을 입력하세요..."
                            className="w-full h-16 text-sm focus:outline-none resize-none"
                            value={replyTarget.text}
                            onChange={(e) => setReplyTarget({ ...replyTarget, text: e.target.value })}
                          />
                          <div className="flex gap-2 self-end">
                            <button onClick={() => setReplyTarget(null)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer">취소</button>
                            <button
                              onClick={handleReplySubmit}
                              disabled={submitting || !replyTarget.text.trim()}
                              className="px-3 py-1.5 bg-main text-white text-sm font-semibold rounded-xl transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
                            >
                              {submitting ? "등록 중..." : "등록"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!commentsLast && (
                <div ref={commentSentinelRef} className="flex h-9 items-center justify-center text-sm text-ink-muted">
                  {loadingMoreComments && "불러오는 중..."}
                </div>
              )}
              {/* 댓글 달기 */}
              <div className="flex items-start gap-4 pt-4">
                <div className="flex flex-col gap-2 w-full p-6 border border-line rounded-lg">
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
              <div className="flex flex-col divide-y divide-line">
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
