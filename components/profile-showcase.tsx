"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, ImageIcon, Type, X, Users } from "lucide-react"

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
  friends?: Friend[]
  resumeFile?: string
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
  friends = [],
  resumeFile = "",
}: ProfileShowcaseProps) {
  const [focusedItem, setFocusedItem] = useState<ShowcaseItem | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const [activeTab, setActiveTab] = useState<"showcase" | "resume">("showcase")
  const [showResumeModal, setShowResumeModal] = useState(false)

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

  const renderContent = (item: ShowcaseItem, isFocused = false) => {
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

  const getProfileLayout = () => {
    switch (layout) {
      case "minimal":
        return (
          <div className="text-center p-8 bg-card rounded-lg border relative">
            <img
              src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
              alt="Profile Picture"
              className="w-32 h-32 rounded-full object-cover border-2 mx-auto mb-4"
              style={{ borderColor: contentBoxTrimColor }}
            />
            <h1 className="text-4xl font-bold mb-2">{profileName || "Profile Showcase"}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {profileDescription || "Welcome to my profile! Check out my showcase below."}
            </p>
            <div className="absolute top-4 right-4">
              {friends.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConnections(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {friends.length} Connections
                </Button>
              )}
            </div>
          </div>
        )
      case "grid":
        return (
          <div className="bg-card rounded-lg border p-4 relative">
            <div className="flex items-center gap-4">
              <img
                src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                alt="Profile Picture"
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: contentBoxTrimColor }}
              />
              <div>
                <h1 className="text-2xl font-bold">{profileName || "Profile Showcase"}</h1>
                <p className="text-muted-foreground text-sm">{profileDescription || "Welcome to my profile!"}</p>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              {friends.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConnections(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {friends.length}
                </Button>
              )}
            </div>
          </div>
        )
      case "masonry":
        return (
          <div className="bg-gradient-to-r from-card to-card/50 rounded-lg border p-6 mb-8 relative">
            <div className="flex items-start gap-6">
              <img
                src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                alt="Profile Picture"
                className="w-20 h-20 rounded-lg object-cover border-2"
                style={{ borderColor: contentBoxTrimColor }}
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profileName || "Profile Showcase"}</h1>
                <p className="text-muted-foreground leading-relaxed">
                  {profileDescription || "Welcome to my profile! Check out my showcase below."}
                </p>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              {friends.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConnections(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {friends.length}
                </Button>
              )}
            </div>
          </div>
        )
      case "spotlight":
        return (
          <div className="relative bg-card rounded-lg border overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative p-8 text-center">
              <img
                src={profilePicture || "/placeholder.svg?height=120&width=120&query=professional profile avatar"}
                alt="Profile Picture"
                className="w-40 h-40 rounded-full object-cover border-4 mx-auto mb-6 shadow-lg"
                style={{ borderColor: contentBoxTrimColor }}
              />
              <h1 className="text-5xl font-bold mb-4">{profileName || "Profile Showcase"}</h1>
              <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
                {profileDescription || "Welcome to my profile! Check out my showcase below."}
              </p>
            </div>
            <div className="absolute top-4 right-4">
              {friends.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConnections(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {friends.length}
                </Button>
              )}
            </div>
          </div>
        )
      default:
        return (
          <div className="flex items-start justify-between gap-6 p-6 bg-card rounded-lg border relative">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{profileName || "Profile Showcase"}</h1>
                {friends.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConnections(true)}
                    className="text-muted-foreground hover:text-foreground h-6 px-2"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    <span className="text-xs">{friends.length}</span>
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {profileDescription || "Welcome to my profile! Check out my showcase below."}
              </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
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

  const renderShowcaseItem = (item: ShowcaseItem, index: number) => {
    const cardClasses =
      layout === "masonry"
        ? "break-inside-avoid mb-6"
        : layout === "spotlight" && index === 0
          ? "md:col-span-2 lg:col-span-3"
          : item.size === "long"
            ? layout === "grid"
              ? "col-span-2 md:col-span-3 lg:col-span-4"
              : "md:col-span-2 lg:col-span-3"
            : ""

    const cardSize = layout === "grid" ? "h-48" : layout === "minimal" ? "h-64" : "h-auto"

    return (
      <Card
        key={item.id}
        className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${cardClasses} ${
          layout === "spotlight" ? "hover:scale-[1.02]" : ""
        }`}
        style={{
          backgroundColor: contentBoxColor,
          borderColor: contentBoxTrimColor,
          borderWidth: "2px",
        }}
      >
        <CardHeader className={layout === "grid" ? "pb-2" : "pb-3"}>
          <div className="flex items-center justify-between">
            <CardTitle className={layout === "grid" ? "text-sm" : "text-lg"}>{item.title}</CardTitle>
            <div className="flex items-center gap-2">
              {item.size === "long" && (
                <Badge variant="outline" className="text-xs">
                  Long
                </Badge>
              )}
            </div>
          </div>
          {item.description && (
            <CardDescription className={layout === "grid" ? "text-xs" : ""}>{item.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className={cardSize}>{renderContent(item)}</div>
        </CardContent>
      </Card>
    )
  }

  const backgroundStyle = {
    backgroundColor,
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }),
  }

  return (
    <>
      <div className="space-y-8" style={backgroundStyle}>
        <div className="p-6 rounded-lg">
          {getProfileLayout()}

          <div className="mt-8 mb-6 flex items-center justify-between">
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border">
              <button
                onClick={() => setActiveTab("showcase")}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "showcase"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                Portfolio Showcase
              </button>
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "resume"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
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
                className="gap-2 bg-background/50 hover:bg-background border-border/50"
              >
                <ImageIcon className="h-4 w-4" />
                View Resume
              </Button>
            )}
          </div>

          {activeTab === "showcase" && (
            <div className={getLayoutClasses()}>{items.map((item, index) => renderShowcaseItem(item, index))}</div>
          )}

          {activeTab === "resume" && (
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-foreground">Professional Resume</h3>
                {resumeFile && (
                  <Button onClick={() => setShowResumeModal(true)} variant="outline" size="sm" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Full Screen
                  </Button>
                )}
              </div>
              {resumeFile ? (
                <div className="bg-background rounded-lg border border-border overflow-hidden shadow-inner">
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
                <div className="bg-background rounded-lg border border-border p-12 text-center">
                  <div className="text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No resume uploaded yet</p>
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
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
          <div className="relative h-[95vh]">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a")
                  link.href = resumeFile
                  link.download = `${profileName || "Resume"}.pdf`
                  link.click()
                }}
                className="bg-background/90 hover:bg-background"
              >
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/90 hover:bg-background"
                onClick={() => setShowResumeModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <iframe
              src={resumeFile}
              className="w-full h-full rounded-lg"
              title="Resume - Full Screen"
              style={{ border: "none" }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!focusedItem} onOpenChange={() => setFocusedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {focusedItem && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setFocusedItem(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">{focusedItem.title}</h2>
                  {focusedItem.description && <p className="text-muted-foreground mt-1">{focusedItem.description}</p>}
                </div>
                <div className="flex justify-center">{renderContent(focusedItem, true)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
