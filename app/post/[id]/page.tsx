"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PostCard } from "@/components/post-card"
import { getPostById, type Post } from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function PostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
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

  const backgroundColor = profile?.backgroundColor || "#ffffff"
  const textColor = profile?.textColor || "#000000"
  const currentTheme = profile?.theme || "light-business"

  function isDark(color: string) {
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness < 128
  }

  const buttonStyle = {
    backgroundColor: isDark(backgroundColor) ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    color: textColor,
    borderColor: isDark(backgroundColor) ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
  }

  if (loading || profileLoading) {
    return (
      <div className={`min-h-screen ${currentTheme}`} style={{ backgroundColor }}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: textColor }} />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className={`min-h-screen ${currentTheme}`} style={{ backgroundColor }}>
        <div className="max-w-3xl mx-auto p-6">
          <Button variant="ghost" onClick={handleBackToFeed} className="mb-6 gap-2" style={buttonStyle}>
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: textColor }}>
              {error || "Post not found"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${currentTheme}`} style={{ backgroundColor }}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={handleBackToFeed} className="gap-2" style={buttonStyle}>
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Button>

        <PostCard post={post} currentUserId={user?.uid} onPostDeleted={handlePostDeleted} isClickable={false} />
      </div>
    </div>
  )
}
