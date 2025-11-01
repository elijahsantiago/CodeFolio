"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { PostCard } from "@/components/post-card"
import { CreatePostForm } from "@/components/create-post-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, RefreshCw, Search, X, Plus, Minus } from "lucide-react"
import { getPosts, searchPosts, type Post } from "@/lib/firestore"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const loadPosts = async (loadMore = false, searchQuery?: string) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      // Use provided searchQuery or fall back to state
      const queryToUse = searchQuery !== undefined ? searchQuery : searchTerm
      console.log("[v0] Loading posts, searchTerm:", queryToUse.trim())

      const result = queryToUse.trim()
        ? await searchPosts(queryToUse, 20)
        : await getPosts(20, loadMore ? lastDoc : undefined)

      console.log("[v0] Posts loaded:", result.posts.length)

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
      setIsSearching(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    if (highlightPostId && posts.length > 0 && postRefs.current[highlightPostId]) {
      setTimeout(() => {
        const element = postRefs.current[highlightPostId]
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Search submitted with term:", searchTerm)
    setIsSearching(true)
    setLastDoc(null)
    loadPosts()
  }

  const handleClearSearch = () => {
    console.log("[v0] Clearing search")
    setSearchTerm("")
    setIsSearching(true)
    setLastDoc(null)
    loadPosts(false, "") // Pass empty string directly
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Live Feed</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 bg-transparent w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search posts or hashtags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {isSearching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching...
            </span>
          ) : (
            <span>
              Showing results for: <span className="font-semibold text-foreground">{searchTerm}</span>
              {posts.length === 0 && " (no results found)"}
            </span>
          )}
        </div>
      )}

      {user && showCreatePost && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <CreatePostForm onPostCreated={handlePostCreated} />
        </div>
      )}

      {user && (
        <button
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group"
          aria-label={showCreatePost ? "Close post creation" : "Create new post"}
        >
          {showCreatePost ? (
            <Minus className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:rotate-90" />
          ) : (
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:rotate-90" />
          )}
        </button>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "No posts found matching your search." : "No posts yet. Be the first to post!"}
            </p>
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

            {hasMore && !searchTerm && (
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
