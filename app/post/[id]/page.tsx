"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PostCard } from "@/components/post-card"
import { getPostById, type Post } from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function PostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return

      try {
        setLoading(true)
        const fetchedPost = await getPostById(postId)
        if (fetchedPost) {
          setPost(fetchedPost)
        } else {
          setError("Post not found")
        }
      } catch (err) {
        console.error("[v0] Error loading post:", err)
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [postId])

  const handleBackToFeed = () => {
    router.push("/?view=feed")
  }

  const handlePostDeleted = () => {
    router.push("/?view=feed")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6">
          <Button variant="ghost" onClick={handleBackToFeed} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{error || "Post not found"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={handleBackToFeed} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Button>

        <PostCard post={post} currentUserId={user?.uid} onPostDeleted={handlePostDeleted} isClickable={false} />
      </div>
    </div>
  )
}
