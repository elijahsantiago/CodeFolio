"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Eye, Trash2, Send, Reply, X } from "lucide-react"
import {
  toggleLikePost,
  addComment,
  getComments,
  incrementPostView,
  deletePost,
  deleteComment,
  adminDeletePost,
  adminDeleteComment,
  type Post,
  type Comment,
} from "@/lib/firestore"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface PostCardProps {
  post: Post
  currentUserId?: string
  onPostDeleted?: (postId: string) => void
  isClickable?: boolean
  onPostClick?: () => void
  autoShowComments?: boolean
  commentsLayout?: "below" | "side"
  compact?: boolean
}

export function PostCard({
  post,
  currentUserId,
  onPostDeleted,
  isClickable = true,
  onPostClick,
  autoShowComments = false,
  commentsLayout = "below",
  compact = false,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [commentCount, setCommentCount] = useState(post.commentCount || 0)
  const [showComments, setShowComments] = useState(autoShowComments)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const { profile } = useProfile()
  const { user } = useAuth()
  const router = useRouter()

  const isAdmin = user?.email === "e.santiago.e1@gmail.com" || user?.email === "gabeasosa@gmail.com"
  const canDeletePost = currentUserId === post.userId || isAdmin

  useEffect(() => {
    if (currentUserId) {
      setIsLiked(post.likes?.includes(currentUserId) || false)
    }
  }, [currentUserId, post.likes])

  useEffect(() => {
    if (!db || !post.id) return

    const postRef = doc(db, "posts", post.id)
    const unsubscribe = onSnapshot(
      postRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          if (data.commentCount !== undefined) {
            setCommentCount(data.commentCount)
          }
        }
      },
      (error) => {
        console.error("[v0] Error listening to post updates:", error)
      },
    )

    return () => unsubscribe()
  }, [post.id])

  useEffect(() => {
    if (post.id) {
      incrementPostView(post.id)
    }
  }, [post.id])

  useEffect(() => {
    if (autoShowComments) {
      loadComments()
    }
  }, [autoShowComments])

  const handleLike = async () => {
    if (!currentUserId || !profile) return

    try {
      const newIsLiked = !isLiked
      setIsLiked(newIsLiked)
      setLikeCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)))

      await toggleLikePost(post.id, currentUserId, profile.profileName, profile.profilePicture)
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const loadComments = async () => {
    if (comments.length > 0) return

    setLoadingComments(true)
    try {
      const fetchedComments = await getComments(post.id)
      setComments(fetchedComments)
    } catch (error) {
      console.error("[v0] Error loading comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleToggleComments = () => {
    if (!showComments) {
      loadComments()
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async () => {
    if (!currentUserId || !profile || !commentText.trim()) return

    setSubmittingComment(true)
    try {
      const commentId = await addComment(
        post.id,
        currentUserId,
        profile.profileName,
        profile.profilePicture,
        commentText,
        replyingTo || undefined,
      )

      const newComment: Comment = {
        id: commentId,
        postId: post.id,
        userId: currentUserId,
        userName: profile.profileName,
        userPicture: profile.profilePicture,
        content: commentText,
        parentCommentId: replyingTo || undefined,
        createdAt: { toMillis: () => Date.now() } as any,
      }

      setComments((prev) => [...prev, newComment])
      setCommentCount((prev) => prev + 1)
      setCommentText("")
      setReplyingTo(null)
    } catch (error) {
      console.error("[v0] Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUserId || !canDeletePost) return

    if (!confirm("Are you sure you want to delete this post?")) return

    setDeleting(true)
    try {
      if (isAdmin && currentUserId !== post.userId) {
        await adminDeletePost(user?.email || "", post.id)
      } else {
        await deletePost(post.id, currentUserId)
      }
      onPostDeleted?.(post.id)
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      alert("Failed to delete post")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!currentUserId || (!isAdmin && currentUserId !== commentUserId)) return

    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      if (isAdmin && currentUserId !== commentUserId) {
        await adminDeleteComment(user?.email || "", post.id, commentId)
      } else {
        await deleteComment(post.id, commentId, currentUserId)
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setCommentCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("[v0] Error deleting comment:", error)
      alert("Failed to delete comment")
    }
  }

  const handleReply = (commentId: string, userName: string) => {
    setReplyingTo(commentId)
    setCommentText(`@${userName} `)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setCommentText("")
  }

  const getParentComment = (parentId: string) => {
    return comments.find((c) => c.id === parentId)
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.toMillis())
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return "Just now"
    }
  }

  const topLevelComments = comments.filter((c) => !c.parentCommentId)
  const getReplies = (commentId: string) => comments.filter((c) => c.parentCommentId === commentId)

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}?from=feed`)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("textarea") ||
      target.closest("input") ||
      target.closest("a") ||
      !isClickable
    ) {
      return
    }

    if (compact) {
      router.push(`/post/${post.id}`)
    } else if (onPostClick) {
      onPostClick()
    }
  }

  const renderTextWithHashtags = (text: string) => {
    const parts = text.split(/(\s+)/)
    return parts.map((part, index) => {
      if (part.match(/^#\w+/)) {
        return (
          <span
            key={index}
            className="text-primary font-semibold cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Navigate to hashtag search page
              console.log("[v0] Clicked hashtag:", part)
            }}
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const renderCommentsSection = () => (
    <div className="space-y-4">
      {loadingComments ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
      ) : (
        <>
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {topLevelComments.map((comment) => {
                const replies = getReplies(comment.id)
                const canDeleteComment = currentUserId === comment.userId || isAdmin
                return (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex gap-3">
                      <img
                        src={comment.userPicture || "/placeholder.svg?height=32&width=32&query=profile avatar"}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigateToProfile(comment.userId)}
                      />
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className="font-semibold text-sm cursor-pointer hover:underline"
                              onClick={() => navigateToProfile(comment.userId)}
                            >
                              {comment.userName}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</p>
                            {canDeleteComment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id, comment.userId)}
                                className="h-5 w-5 p-0 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                        {currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReply(comment.id, comment.userName)}
                            className="mt-1 h-7 text-xs gap-1"
                          >
                            <Reply className="h-3 w-3" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>

                    {replies.length > 0 && (
                      <div className="ml-11 space-y-2">
                        {replies.map((reply) => {
                          const canDeleteReply = currentUserId === reply.userId || isAdmin
                          return (
                            <div key={reply.id} className="flex gap-3">
                              <img
                                src={reply.userPicture || "/placeholder.svg?height=28&width=28&query=profile avatar"}
                                alt={reply.userName}
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigateToProfile(reply.userId)}
                              />
                              <div className="flex-1">
                                <div className="bg-muted/70 rounded-lg p-2.5">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p
                                      className="font-semibold text-xs sm:text-sm cursor-pointer hover:underline"
                                      onClick={() => navigateToProfile(reply.userId)}
                                    >
                                      {reply.userName}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      {formatTimestamp(reply.createdAt)}
                                    </p>
                                    {canDeleteReply && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteComment(reply.id, reply.userId)}
                                        className="h-5 w-5 p-0 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm leading-relaxed">{reply.content}</p>
                                </div>
                                {currentUserId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReply(comment.id, reply.userName)}
                                    className="mt-1 h-6 text-xs sm:text-sm gap-1"
                                  >
                                    <Reply className="h-3 w-3" />
                                    Reply
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {currentUserId && profile && (
            <div className="space-y-2 pt-2">
              {replyingTo && (
                <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Replying to <span className="font-semibold">{getParentComment(replyingTo)?.userName}</span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleCancelReply} className="h-6 text-xs sm:text-sm">
                    Cancel
                  </Button>
                </div>
              )}
              <div className="flex gap-3">
                <img
                  src={profile.profilePicture || "/placeholder.svg?height=32&width=32&query=profile avatar"}
                  alt="Your avatar"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                    className="min-h-[60px] resize-none"
                    disabled={submittingComment}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  if (compact) {
    return (
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
        onClick={handleCardClick}
      >
        {post.imageUrl && (
          <div className="relative h-48 overflow-hidden bg-muted">
            <img src={post.imageUrl || "/placeholder.svg"} alt="Post image" className="w-full h-full object-cover" />
            {canDeletePost && (
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={deleting}
                className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <img
              src={post.userPicture || "/placeholder.svg?height=32&width=32&query=profile avatar"}
              alt={post.userName}
              className="w-8 h-8 rounded-full object-cover"
              onClick={(e) => {
                e.stopPropagation()
                navigateToProfile(post.userId)
              }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-sm truncate cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  navigateToProfile(post.userId)
                }}
              >
                {post.userName}
              </p>
              <p className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed line-clamp-3 mb-3 flex-1">{renderTextWithHashtags(post.content)}</p>

          <div className="flex items-center gap-4 pt-3 border-t text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground ml-auto">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (commentsLayout === "side") {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Post Card - centered and responsive width */}
        <Card
          className={`flex-shrink-0 w-full lg:max-w-2xl p-4 sm:p-6 space-y-4 ${isClickable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
          onClick={handleCardClick}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img
                src={post.userPicture || "/placeholder.svg?height=40&width=40&query=profile avatar"}
                alt={post.userName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={() => navigateToProfile(post.userId)}
              />
              <div className="min-w-0">
                <p
                  className="font-semibold cursor-pointer hover:underline text-sm sm:text-base truncate"
                  onClick={() => navigateToProfile(post.userId)}
                >
                  {post.userName}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
              </div>
            </div>

            {canDeletePost && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {renderTextWithHashtags(post.content)}
            </p>

            {post.imageUrl && (
              <>
                <div
                  className="rounded-lg overflow-hidden border cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFullImage(true)
                  }}
                >
                  <img
                    src={post.imageUrl || "/placeholder.svg"}
                    alt="Post image"
                    className="w-full max-h-[400px] sm:max-h-[600px] object-contain bg-muted"
                  />
                </div>

                {showFullImage && (
                  <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setShowFullImage(false)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-white hover:bg-white/20"
                      onClick={() => setShowFullImage(false)}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                    <img
                      src={post.imageUrl || "/placeholder.svg"}
                      alt="Post image full view"
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4 sm:gap-6 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!currentUserId}
              className={`gap-1 sm:gap-2 ${isLiked ? "text-red-500 hover:text-red-600" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{likeCount}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleToggleComments} className="gap-1 sm:gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{commentCount}</span>
            </Button>

            <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-sm ml-auto">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </Card>

        {/* Comments Panel - stacks below on mobile, side on desktop */}
        {showComments && (
          <Card className="w-full lg:flex-1 lg:min-w-[400px] lg:max-w-xl p-4 sm:p-6">
            <h3 className="font-semibold text-base sm:text-lg mb-4">Comments ({commentCount})</h3>
            {renderCommentsSection()}
          </Card>
        )}
      </div>
    )
  }

  return (
    <Card
      className={`p-6 space-y-4 ${isClickable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.userPicture || "/placeholder.svg?height=40&width=40&query=profile avatar"}
            alt={post.userName}
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigateToProfile(post.userId)}
          />
          <div>
            <p className="font-semibold cursor-pointer hover:underline" onClick={() => navigateToProfile(post.userId)}>
              {post.userName}
            </p>
            <p className="text-sm text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>

        {canDeletePost && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{renderTextWithHashtags(post.content)}</p>

        {post.imageUrl && (
          <>
            <div
              className="rounded-lg overflow-hidden border cursor-pointer hover:opacity-95 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                setShowFullImage(true)
              }}
            >
              <img
                src={post.imageUrl || "/placeholder.svg"}
                alt="Post image"
                className="w-full max-h-96 object-cover"
              />
            </div>

            {showFullImage && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setShowFullImage(false)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setShowFullImage(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <img
                  src={post.imageUrl || "/placeholder.svg"}
                  alt="Post image full view"
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-6 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={!currentUserId}
          className={`gap-2 ${isLiked ? "text-red-500 hover:text-red-600" : ""}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleToggleComments} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </Button>

        <div className="flex items-center gap-2 text-muted-foreground text-sm ml-auto">
          <Eye className="h-4 w-4" />
          <span>{post.viewCount || 0}</span>
        </div>
      </div>

      {showComments && <div className="space-y-4 pt-4 border-t">{renderCommentsSection()}</div>}
    </Card>
  )
}
