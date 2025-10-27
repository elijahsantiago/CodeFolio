"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Eye, Trash2, Send } from "lucide-react"
import {
  toggleLikePost,
  addComment,
  getComments,
  incrementPostView,
  deletePost,
  type Post,
  type Comment,
} from "@/lib/firestore"
import { useProfile } from "@/hooks/use-profile"
import { formatDistanceToNow } from "date-fns"

interface PostCardProps {
  post: Post
  currentUserId?: string
  onPostDeleted?: (postId: string) => void
}

export function PostCard({ post, currentUserId, onPostDeleted }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { profile } = useProfile()

  useEffect(() => {
    if (currentUserId) {
      setIsLiked(post.likes?.includes(currentUserId) || false)
    }
  }, [currentUserId, post.likes])

  useEffect(() => {
    // Increment view count when post is rendered
    if (post.id) {
      incrementPostView(post.id)
    }
  }, [post.id])

  const handleLike = async () => {
    if (!currentUserId) return

    try {
      const newIsLiked = !isLiked
      setIsLiked(newIsLiked)
      setLikeCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)))

      await toggleLikePost(post.id, currentUserId)
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
      // Revert on error
      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const loadComments = async () => {
    if (comments.length > 0) return // Already loaded

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
      )

      const newComment: Comment = {
        id: commentId,
        postId: post.id,
        userId: currentUserId,
        userName: profile.profileName,
        userPicture: profile.profilePicture,
        content: commentText,
        createdAt: { toMillis: () => Date.now() } as any,
      }

      setComments((prev) => [...prev, newComment])
      setCommentText("")
    } catch (error) {
      console.error("[v0] Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUserId || post.userId !== currentUserId) return

    if (!confirm("Are you sure you want to delete this post?")) return

    setDeleting(true)
    try {
      await deletePost(post.id, currentUserId)
      onPostDeleted?.(post.id)
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      alert("Failed to delete post")
    } finally {
      setDeleting(false)
    }
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

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.userPicture || "/placeholder.svg?height=40&width=40&query=profile avatar"}
            alt={post.userName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{post.userName}</p>
            <p className="text-sm text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>

        {currentUserId === post.userId && (
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
        <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.imageUrl && (
          <div className="rounded-lg overflow-hidden border">
            <img src={post.imageUrl || "/placeholder.svg"} alt="Post image" className="w-full max-h-96 object-cover" />
          </div>
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
          <span>{post.commentCount || 0}</span>
        </Button>

        <div className="flex items-center gap-2 text-muted-foreground text-sm ml-auto">
          <Eye className="h-4 w-4" />
          <span>{post.viewCount || 0}</span>
        </div>
      </div>

      {showComments && (
        <div className="space-y-4 pt-4 border-t">
          {loadingComments ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
          ) : (
            <>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.userPicture || "/placeholder.svg?height=32&width=32&query=profile avatar"}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{comment.userName}</p>
                          <p className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</p>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentUserId && profile && (
                <div className="flex gap-3 pt-2">
                  <img
                    src={profile.profilePicture || "/placeholder.svg?height=32&width=32&query=profile avatar"}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
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
              )}
            </>
          )}
        </div>
      )}
    </Card>
  )
}
