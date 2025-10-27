"use client"

import { useState, useEffect, useRef } from "react"
import { PostCard } from "@/components/post-card"
import { CreatePostForm } from "@/components/create-post-form"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { getPosts, type Post } from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface LiveFeedProps {
  highlightPostId?: string | null
  onPostHighlighted?: () => void
}

export function LiveFeed({ highlightPostId, onPostHighlighted }: LiveFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const loadPosts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const result = await getPosts(20, loadMore ? lastDoc : undefined)

      if (loadMore) {
        setPosts((prev) => [...prev, ...result.posts])
      } else {
        setPosts(result.posts)
      }

      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("[v0] Error loading posts:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    if (highlightPostId && posts.length > 0 && postRefs.current[highlightPostId]) {
      // Wait a bit for rendering to complete
      setTimeout(() => {
        const element = postRefs.current[highlightPostId]
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          // Clear highlight after scrolling
          if (onPostHighlighted) {
            setTimeout(() => onPostHighlighted(), 2000)
          }
        }
      }, 100)
    }
  }, [highlightPostId, posts, onPostHighlighted])

  const handleRefresh = () => {
    setRefreshing(true)
    setLastDoc(null)
    loadPosts()
  }

  const handlePostCreated = () => {
    handleRefresh()
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handlePostClick = (post: Post) => {
    router.push(`/post/${post.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Live Feed</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {user && <CreatePostForm onPostCreated={handlePostCreated} />}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <p className="text-muted-foreground text-lg">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <div
                key={post.id}
                ref={(el) => {
                  postRefs.current[post.id] = el
                }}
                className={highlightPostId === post.id ? "ring-2 ring-primary rounded-xl transition-all" : ""}
              >
                <PostCard
                  post={post}
                  currentUserId={user?.uid}
                  onPostDeleted={handlePostDeleted}
                  onPostClick={() => handlePostClick(post)}
                />
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => loadPosts(true)} disabled={loadingMore} className="gap-2">
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
