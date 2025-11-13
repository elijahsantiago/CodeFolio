"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { PostCard } from "@/components/post-card"
import { CreatePostForm } from "@/components/create-post-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Search, X, Plus, Minus } from "lucide-react"
import { getPosts, searchPosts, getTrendingPosts, getRecommendedPosts, type Post } from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface LiveFeedProps {
  highlightPostId?: string | null
  onPostHighlighted?: () => void
}

export function LiveFeed({ highlightPostId, onPostHighlighted }: LiveFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "network">("all")
  const { user } = useAuth()
  const router = useRouter()
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowSearch(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowSearch(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const loadPosts = async (loadMore = false, searchQuery?: string) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const queryToUse = searchQuery !== undefined ? searchQuery : searchTerm

      const result = queryToUse.trim()
        ? await searchPosts(queryToUse, 20)
        : await getPosts(20, loadMore ? lastDoc : undefined)

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
    const loadAllContent = async () => {
      await loadPosts()

      const trending = await getTrendingPosts(20)
      setTrendingPosts(trending)

      if (user?.uid) {
        const recommended = await getRecommendedPosts(user.uid, 20)
        setRecommendedPosts(recommended)
      }
    }

    loadAllContent()
  }, [user?.uid])

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

  const handleRefresh = async () => {
    setRefreshing(true)
    setLastDoc(null)
    await loadPosts()

    const trending = await getTrendingPosts(20)
    setTrendingPosts(trending)

    if (user?.uid) {
      const recommended = await getRecommendedPosts(user.uid, 20)
      setRecommendedPosts(recommended)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setLastDoc(null)
    loadPosts()
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setIsSearching(true)
    setLastDoc(null)
    loadPosts(false, "")
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
    handleRefresh()
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    setTrendingPosts((prev) => prev.filter((post) => post.id !== postId))
    setRecommendedPosts((prev) => prev.filter((post) => post.id !== postId))
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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Live Feed</h2>
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

      <div
        className={`transition-all duration-300 overflow-hidden ${
          showSearch ? "max-h-24 sm:max-h-32 opacity-100 mb-4 sm:mb-0" : "max-h-0 opacity-0"
        }`}
      >
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {searchTerm && (
          <div className="text-xs sm:text-sm text-muted-foreground mt-2">
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </span>
            ) : (
              <span>
                Results for: <span className="font-semibold text-foreground">{searchTerm}</span>
                {posts.length === 0 && " (no results)"}
              </span>
            )}
          </div>
        )}
      </div>

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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "all" | "trending" | "network")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm p-0.5 sm:p-1 rounded-lg sm:rounded-xl border shadow-sm">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger
            value="network"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
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
        </TabsContent>

        <TabsContent value="trending" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {trendingPosts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <p className="text-muted-foreground text-lg">No trending posts at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {trendingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.uid}
                  onPostDeleted={handlePostDeleted}
                  onPostClick={() => handlePostClick(post)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="network" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {!user ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <p className="text-muted-foreground text-lg">Sign in to see posts from your network.</p>
            </div>
          ) : recommendedPosts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <p className="text-muted-foreground text-lg">
                No posts from your network yet. Connect with others to see their posts here!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {recommendedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.uid}
                  onPostDeleted={handlePostDeleted}
                  onPostClick={() => handlePostClick(post)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
