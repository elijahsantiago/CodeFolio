"use client"

import { useState, useEffect, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, ImageIcon, Type, Users, Shield } from "lucide-react"
import { getContrastTextColor } from "@/lib/color-utils"
import { PostCard } from "@/components/post-card"

interface ShowcaseItem {
  id: string
  type: "image" | "video" | "text"
  content: string
  title: string
  description: string
  size?: "normal" | "long"
}

interface Friend {
  id: string
  name: string
  avatar: string
  status: "online" | "offline" | "away"
  lastSeen?: string
}

interface Post {
  id: string
  userId: string
  content: string
  imageUrl?: string
  createdAt: Date
  likes: string[]
  commentCount: number
  userProfile?: {
    profileName: string
    profilePicture?: string
  }
  hashtags?: string[]
}

interface ProfileShowcaseProps {
  items: ShowcaseItem[]
  profilePicture?: string
  profileName?: string
  profileDescription?: string
  layout?: "default" | "minimal" | "grid" | "masonry" | "spotlight"
  backgroundColor?: string
  backgroundImage?: string
  contentBoxColor?: string
  contentBoxTrimColor?: string
  profileInfoColor?: string
  profileInfoTrimColor?: string
  textColor?: string
  bannerImage?: string
  friends?: Friend[]
  resumeFile?: string
  isViewOnly?: boolean
  onViewConnections?: () => void
  userEmail?: string
  onDeleteItem?: (itemId: string) => void
  posts?: Post[]
  postsLoading?: boolean
  currentUserId?: string
}

export function ProfileShowcase({
  items,
  profilePicture,
  profileName,
  profileDescription,
  layout = "default",
  backgroundColor = "#ffffff",
  backgroundImage,
  contentBoxColor = "#ffffff",
  contentBoxTrimColor = "#6b7280",
  profileInfoColor = "#ffffff",
  profileInfoTrimColor = "#6b7280",
  textColor,
  bannerImage,
  friends = [],
  resumeFile = "",
  isViewOnly = false,
  onViewConnections,
  userEmail = "",
  onDeleteItem,
  posts = [],
  postsLoading = false,
  currentUserId,
}: ProfileShowcaseProps) {
  const [focusedItem, setFocusedItem] = useState<ShowcaseItem | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const [activeTab, setActiveTab] = useState<"showcase" | "posts" | "resume">("showcase")
  const [showResumeModal, setShowResumeModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] ProfileShowcase received posts:", posts.length, "posts")
    console.log("[v0] ProfileShowcase postsLoading:", postsLoading)
    console.log("[v0] ProfileShowcase posts data:", posts)
  }, [posts, postsLoading])

  const computedTextColor = textColor || getContrastTextColor(backgroundColor)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Play className="h-4 w-4" />
      case "text":
        return <Type className="h-4 w-4" />
      default:
        return null
    }
  }

  const renderContentItem = (item: ShowcaseItem, isFocused = false) => {
    const imageClasses = isFocused
      ? "w-full max-h-[70vh] object-contain"
      : "w-full h-48 object-cover transition-transform hover:scale-105"
    const videoClasses = isFocused ? "w-full max-h-[70vh]" : "w-full h-48 object-cover"

    switch (item.type) {
      case "image":
        return (
          <div
            className={`relative overflow-hidden ${isFocused ? "" : "rounded-lg cursor-pointer"}`}
            onClick={() => !isFocused && setFocusedItem(item)}
          >
            <img src={item.content || "/placeholder.svg"} alt={item.title} className={imageClasses} />
          </div>
        )
      case "video":
        return (
          <div
            className={`relative overflow-hidden ${isFocused ? "" : "rounded-lg cursor-pointer bg-muted"}`}
            onClick={() => !isFocused && setFocusedItem(item)}
          >
            {item.content.startsWith("data:video") ? (
              <video
                src={item.content}
                className={videoClasses}
                controls={isFocused}
                preload="metadata"
                poster="/video-thumbnail.png"
              />
            ) : (
              <img src={item.content || "/placeholder.svg"} alt={item.title} className={videoClasses} />
            )}
          </div>
        )
      case "text":
        return (
          <div
            className={`p-4 bg-muted rounded-lg ${isFocused ? "" : "cursor-pointer"}`}
            onClick={() => !isFocused && setFocusedItem(item)}
          >
            <p className={`text-foreground leading-relaxed ${isFocused ? "text-lg" : ""}`}>{item.content}</p>
          </div>
        )
      default:
        return null
    }
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case "minimal":
        return "grid grid-cols-1 md:grid-cols-2 gap-8"
      case "grid":
        return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      case "masonry":
        return "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
      case "spotlight":
        return "flex flex-col gap-6"
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    }
  }

  const isAdmin = userEmail === "e.santiago.e1@gmail.com" || userEmail === "gabeasosa@gmail.com"

  const getProfileLayout = () => {
    const profileBoxStyle = {
      backgroundColor: profileInfoColor,
      borderColor: profileInfoTrimColor,
      color: getContrastTextColor(profileInfoColor),
    }

    const connectionsButton = friends.length > 0 && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowConnections(true)
        }}
        className="gap-2 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
        style={{
          backgroundColor:
            getContrastTextColor(profileInfoColor) === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          color: getContrastTextColor(profileInfoColor),
          borderColor:
            getContrastTextColor(profileInfoColor) === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
        }}
      >
        <Users className="h-4 w-4" />
        <span>{friends.length} Connections</span>
      </Button>
    )

    switch (layout) {
      case "minimal":
        return (
          <div className="text-center p-6 rounded-lg border-2 relative" style={profileBoxStyle}>
            <img
              src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
              alt="Profile Picture"
              className="w-32 h-32 rounded-full object-cover border-2 mx-auto mb-4"
              style={{ borderColor: contentBoxTrimColor }}
            />
            <h1 className="text-4xl font-bold mb-2">{profileName || "Profile Showcase"}</h1>
            <p className="text-lg max-w-2xl mx-auto">
              {profileDescription || "Welcome to my profile! Check out my showcase below."}
            </p>
            {connectionsButton && <div className="absolute top-4 right-4">{connectionsButton}</div>}
          </div>
        )
      case "grid":
        return (
          <div className="rounded-lg border-2 p-4 relative" style={profileBoxStyle}>
            <div className="flex items-center gap-4">
              <img
                src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                alt="Profile Picture"
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: contentBoxTrimColor }}
              />
              <div>
                <h1 className="text-2xl font-bold mb-2">{profileName || "Profile Showcase"}</h1>
                <p className="text-sm mb-2">{profileDescription || "Welcome to my profile!"}</p>
              </div>
            </div>
            {connectionsButton && <div className="absolute top-4 right-4">{connectionsButton}</div>}
          </div>
        )
      case "masonry":
        return (
          <div className="rounded-lg border-2 p-6 mb-8 relative" style={profileBoxStyle}>
            <div className="flex items-start gap-6">
              <img
                src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                alt="Profile Picture"
                className="w-20 h-20 rounded-lg object-cover border-2"
                style={{ borderColor: contentBoxTrimColor }}
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profileName || "Profile Showcase"}</h1>
                <p className="leading-relaxed mb-2">
                  {profileDescription || "Welcome to my profile! Check out my showcase below."}
                </p>
              </div>
            </div>
            {connectionsButton && <div className="absolute top-4 right-4">{connectionsButton}</div>}
          </div>
        )
      case "spotlight":
        return (
          <div className="relative rounded-lg border-2 overflow-hidden" style={profileBoxStyle}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative p-8 text-center">
              <img
                src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                alt="Profile Picture"
                className="w-40 h-40 rounded-full object-cover border-4 mx-auto mb-6 shadow-lg"
                style={{ borderColor: contentBoxTrimColor }}
              />
              <h1 className="text-5xl font-bold mb-4">{profileName || "Profile Showcase"}</h1>
              <p className="text-xl max-w-3xl mx-auto leading-relaxed mb-2">
                {profileDescription || "Welcome to my profile! Check out my showcase below."}
              </p>
            </div>
            {connectionsButton && <div className="absolute top-4 right-4">{connectionsButton}</div>}
          </div>
        )
      default:
        return (
          <div className="rounded-lg border-2 overflow-hidden relative" style={profileBoxStyle}>
            {bannerImage && (
              <div className="h-32 w-full relative">
                <img
                  src={bannerImage || "/placeholder.svg"}
                  alt="Profile Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
              </div>
            )}
            <div className="flex items-start justify-between gap-4 p-4 relative">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{profileName || "Profile Showcase"}</h1>
                  {isAdmin && (
                    <div className="relative">
                      <style jsx>{`
                        @keyframes rainbow-border {
                          0% { border-color: #ff0000; }
                          14% { border-color: #ff7f00; }
                          28% { border-color: #ffff00; }
                          42% { border-color: #00ff00; }
                          57% { border-color: #0000ff; }
                          71% { border-color: #4b0082; }
                          85% { border-color: #9400d3; }
                          100% { border-color: #ff0000; }
                        }
                        .rainbow-outline {
                          animation: rainbow-border 3s linear infinite;
                        }
                      `}</style>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg border-2 rainbow-outline shadow-lg">
                        <Shield className="h-4 w-4 text-foreground" />
                        <span className="text-xs font-bold text-foreground tracking-wide">ADMIN</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="leading-relaxed">
                  {profileDescription || "Welcome to my profile! Check out my showcase below."}
                </p>
                {connectionsButton && <div className="mt-3">{connectionsButton}</div>}
              </div>
              <div className="flex-shrink-0">
                <img
                  src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                  alt="Profile Picture"
                  className="w-24 h-24 rounded-full object-cover border-2"
                  style={{ borderColor: contentBoxTrimColor }}
                />
              </div>
            </div>
          </div>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const renderConnectionsModal = () => (
    <Dialog open={showConnections} onOpenChange={setShowConnections}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Connections ({friends.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => {
                  router.push(`/profile/${friend.id}`)
                  setShowConnections(false)
                }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={friend.avatar || "/placeholder.svg?height=40&width=40&query=profile avatar"}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(friend.status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{friend.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {friend.status === "offline" && friend.lastSeen ? `Last seen ${friend.lastSeen}` : friend.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const backgroundStyle = {
    backgroundColor,
    color: computedTextColor,
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }),
  }

  const renderShowcaseItem = (item: ShowcaseItem, index: number) => {
    const itemStyle = {
      backgroundColor: contentBoxColor,
      borderColor: contentBoxTrimColor,
      color: getContrastTextColor(contentBoxColor),
    }

    if (item.type === "text") {
      return (
        <div
          key={index}
          className="relative rounded-xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          style={itemStyle}
          onClick={() => setFocusedItem(item)}
        >
          {onDeleteItem && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 z-10 opacity-0 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteItem(item.id)
              }}
            >
              Delete
            </Button>
          )}
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
            {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
            <p className="leading-relaxed line-clamp-4">{item.content}</p>
          </div>
        </div>
      )
    }

    return (
      <div
        key={index}
        className="relative rounded-xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        style={itemStyle}
      >
        {onDeleteItem && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 z-10 opacity-0 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteItem(item.id)
            }}
          >
            Delete
          </Button>
        )}
        {renderContentItem(item)}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
          {item.description && <p className="text-xs text-white/90">{item.description}</p>}
        </div>
      </div>
    )
  }

  const navigateToNextItem = () => {
    if (!focusedItem) return
    const currentIndex = items.findIndex((item) => item.id === focusedItem.id)
    const nextIndex = (currentIndex + 1) % items.length
    setFocusedItem(items[nextIndex])
  }

  const navigateToPreviousItem = () => {
    if (!focusedItem) return
    const currentIndex = items.findIndex((item) => item.id === focusedItem.id)
    const previousIndex = (currentIndex - 1 + items.length) % items.length
    setFocusedItem(items[previousIndex])
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!focusedItem) return
    if (e.key === "Escape") {
      setFocusedItem(null)
    }
  }

  useEffect(() => {
    if (focusedItem) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [focusedItem, items])

  return (
    <>
      <div className="space-y-8" style={backgroundStyle}>
        <div className="p-6 rounded-lg">
          {getProfileLayout()}

          <div className="mt-8 mb-6 flex items-center justify-between">
            <div className="flex gap-2 bg-card/50 backdrop-blur-sm p-1.5 rounded-xl border shadow-sm">
              <button
                onClick={() => setActiveTab("showcase")}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === "showcase"
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Portfolio Showcase
              </button>
              <button
                onClick={() => setActiveTab("posts")}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === "posts"
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === "resume"
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Resume
              </button>
            </div>

            {resumeFile && (
              <Button
                onClick={() => setShowResumeModal(true)}
                variant="outline"
                size="sm"
                className="gap-2 bg-card/50 backdrop-blur-sm hover:bg-card border shadow-sm"
              >
                <ImageIcon className="h-4 w-4" />
                View Resume
              </Button>
            )}
          </div>

          {activeTab === "showcase" && (
            <div className={getLayoutClasses()}>{items.map((item, index) => renderShowcaseItem(item, index))}</div>
          )}

          {activeTab === "posts" && (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6">Recent Posts</h3>
              {console.log("[v0] Rendering Posts tab, posts.length:", posts.length, "postsLoading:", postsLoading)}
              {postsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="text-sm text-muted-foreground mt-4">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div key={post.id} className="h-full">
                      <PostCard post={post} currentUserId={currentUserId} isClickable={true} compact={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background rounded-xl border p-16 text-center">
                  <div className="text-muted-foreground">
                    <Type className="h-16 w-16 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium mb-2">No posts yet</p>
                    <p className="text-sm">This user hasn't posted anything to the live feed yet.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "resume" && (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Professional Resume</h3>
                {resumeFile && (
                  <Button onClick={() => setShowResumeModal(true)} variant="outline" size="sm" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Full Screen
                  </Button>
                )}
              </div>
              {resumeFile ? (
                <div className="bg-background rounded-xl border shadow-inner overflow-hidden">
                  <iframe
                    src={resumeFile}
                    className="w-full h-[700px]"
                    title="Resume"
                    style={{ border: "none" }}
                    onLoad={() => console.log("[v0] Resume loaded successfully")}
                    onError={() => console.log("[v0] Resume failed to load")}
                  />
                </div>
              ) : (
                <div className="bg-background rounded-xl border p-16 text-center">
                  <div className="text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium mb-2">No resume uploaded yet</p>
                    <p className="text-sm">Upload your resume in the edit profile section to display it here.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {renderConnectionsModal()}

      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent className="max-w-[90vw] max-h-[95vh] overflow-hidden p-0">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Resume</h2>
            {resumeFile ? (
              <div className="bg-background rounded-xl border shadow-inner overflow-hidden">
                <iframe
                  src={resumeFile}
                  className="w-full h-[80vh]"
                  title="Resume Full Screen"
                  style={{ border: "none" }}
                />
              </div>
            ) : (
              <div className="bg-background rounded-xl border p-16 text-center">
                <p className="text-muted-foreground">No resume available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!focusedItem} onOpenChange={() => setFocusedItem(null)}>
        <DialogContent className="max-w-[75vw] max-h-[95vh] overflow-hidden p-0">
          {focusedItem && (
            <div className="p-12 overflow-y-auto max-h-[95vh] relative">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{focusedItem.title}</h2>
                {focusedItem.description && <p className="text-muted-foreground text-lg">{focusedItem.description}</p>}
              </div>
              <div className="flex justify-center">{renderContentItem(focusedItem, true)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
