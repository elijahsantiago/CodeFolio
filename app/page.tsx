"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProfileShowcase } from "@/components/profile-showcase"
import { ShowcaseEditor } from "@/components/showcase-editor"
import { ProfileSearch } from "@/components/profile-search"
import { LiveFeed } from "@/components/live-feed"
import { Button } from "@/components/ui/button"
import { Edit, Eye, LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { NotificationsPanel } from "@/components/notifications-panel"

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFeed, setShowFeed] = useState(false)
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null)
  const { user, loading: authLoading, logout } = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useProfile()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentLayout, setCurrentLayout] = useState<"default" | "minimal" | "grid" | "masonry" | "spotlight">("grid")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [backgroundImage, setBackgroundImage] = useState("")
  const [contentBoxColor, setContentBoxColor] = useState("#ffffff")
  const [contentBoxTrimColor, setContentBoxTrimColor] = useState("#6b7280")
  const [profileInfoColor, setProfileInfoColor] = useState("#ffffff")
  const [profileInfoTrimColor, setProfileInfoTrimColor] = useState("#6b7280")
  const [textColor, setTextColor] = useState("#000000")
  const [currentTheme, setCurrentTheme] = useState<"light-business" | "dark-business" | "business-casual">(
    "light-business",
  )
  const [resumeFile, setResumeFile] = useState<string>("")

  const [profileData, setProfileData] = useState({
    profilePicture: "/professional-profile-avatar.png",
    profileName: "Professional",
    profileDescription: "Welcome to my profile! I'm passionate about creating and sharing content with the community.",
  })

  const [friends, setFriends] = useState([
    {
      id: "1",
      name: "Alex_Creator",
      avatar: "/profile-avatar-1.png",
      status: "online" as const,
    },
    {
      id: "2",
      name: "Mike_Pro",
      avatar: "/diverse-profile-avatars-2.png",
      status: "away" as const,
    },
    {
      id: "3",
      name: "Sarah_Artist",
      avatar: "/profile-avatar-3.png",
      status: "offline" as const,
      lastSeen: "2 hours ago",
    },
  ])

  const [showcaseItems, setShowcaseItems] = useState([
    {
      id: "1",
      type: "image" as const,
      content: "/creative-workspace-setup.jpg",
      title: "My Workspace",
      description: "A look at my creative workspace",
    },
    {
      id: "2",
      type: "text" as const,
      content: "Welcome to my profile! I'm passionate about creating and sharing content with the community.",
      title: "About Me",
      description: "",
    },
    {
      id: "3",
      type: "video" as const,
      content: "/video-thumbnail.png",
      title: "Latest Project",
      description: "My recent work and highlights",
    },
    {
      id: "4",
      type: "image" as const,
      content: "/creative-workspace-setup.jpg",
      title: "Featured Work",
      description: "One of my favorite projects",
    },
    {
      id: "5",
      type: "text" as const,
      content: "I specialize in creating innovative solutions and bringing creative ideas to life through technology.",
      title: "Skills & Expertise",
      description: "",
    },
    {
      id: "6",
      type: "image" as const,
      content: "/creative-workspace-setup.jpg",
      title: "Recent Achievement",
      description: "A milestone I'm proud of",
    },
    {
      id: "7",
      type: "text" as const,
      content: "Always learning and exploring new technologies to stay at the forefront of innovation.",
      title: "Continuous Learning",
      description: "",
    },
    {
      id: "8",
      type: "image" as const,
      content: "/creative-workspace-setup.jpg",
      title: "Portfolio Highlight",
      description: "Another project I'm proud to showcase",
    },
  ])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const discover = searchParams.get("discover")
    const postId = searchParams.get("post")

    if (discover === "true") {
      setShowSearch(true)
      setShowFeed(false)
      window.history.replaceState({}, "", "/")
    } else if (postId) {
      console.log("[v0] Navigating to post:", postId)
      setShowFeed(true)
      setShowSearch(false)
      setHighlightPostId(postId)
      window.history.replaceState({}, "", "/")
    }
  }, [searchParams])

  useEffect(() => {
    if (profile) {
      setCurrentLayout(profile.layout)
      setBackgroundColor(profile.backgroundColor)
      setBackgroundImage(profile.backgroundImage)
      setContentBoxColor(profile.contentBoxColor)
      setContentBoxTrimColor(profile.contentBoxTrimColor)
      setProfileInfoColor(profile.profileInfoColor || "#ffffff")
      setProfileInfoTrimColor(profile.profileInfoTrimColor || "#6b7280")
      setTextColor(profile.textColor || "#000000")
      setCurrentTheme(profile.theme)
      setResumeFile(profile.resumeFile)
      setProfileData({
        profilePicture: profile.profilePicture,
        profileName: profile.profileName,
        profileDescription: profile.profileDescription,
      })
      setShowcaseItems(profile.showcaseItems)
    }
  }, [profile, user])

  useEffect(() => {
    if (profile && profile.connections) {
      const friendsFromConnections = profile.connections.map((conn) => ({
        id: conn.userId,
        name: conn.profileName,
        avatar: conn.profilePicture,
        status: "offline" as const,
      }))
      setFriends(friendsFromConnections)
    }
  }, [profile])

  const handleProfileUpdate = async (updates: any) => {
    if (profile && updateProfile) {
      try {
        await updateProfile(updates)
      } catch (error) {
        console.error("Error updating profile:", error)
      }
    }
  }

  const handleFriendsChange = async (updatedFriends: any[]) => {
    setFriends(updatedFriends)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

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

  const activeButtonStyle = {
    backgroundColor: isDark(backgroundColor) ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
    color: textColor,
    borderColor: isDark(backgroundColor) ? "#ffffff40" : "#00000020",
  }

  return (
    <div className={`min-h-screen ${currentTheme}`} style={{ backgroundColor }}>
      <main className="container mx-auto px-4 py-8">
        <div
          className="mb-8 flex items-center justify-between sticky top-4 z-40 backdrop-blur-md py-4 px-8 rounded-2xl border-2 shadow-lg"
          style={{
            backgroundColor: `${backgroundColor}ee`,
            color: textColor,
            borderColor: isDark(backgroundColor) ? "#ffffff40" : "#00000020",
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowFeed(false)
                setShowSearch(false)
              }}
              className="font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={!showSearch && !showFeed ? activeButtonStyle : buttonStyle}
            >
              My Profile
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowFeed(true)
                setShowSearch(false)
              }}
              className="font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={showFeed ? activeButtonStyle : buttonStyle}
            >
              Live Feed
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowSearch(true)
                setShowFeed(false)
              }}
              className="font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={showSearch ? activeButtonStyle : buttonStyle}
            >
              Discover Profiles
            </Button>

            {!showSearch && !showFeed && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                size="lg"
                className="gap-2 font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md bg-transparent"
                style={isEditing ? activeButtonStyle : buttonStyle}
              >
                {isEditing ? (
                  <>
                    <Eye className="h-5 w-5" />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5" />
                    Edit Profile
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <NotificationsPanel buttonStyle={buttonStyle} />

            <Button
              variant="outline"
              size="lg"
              onClick={handleLogout}
              className="gap-2 rounded-xl shadow-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md bg-transparent"
              style={buttonStyle}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>

        {showFeed ? (
          <LiveFeed highlightPostId={highlightPostId} onPostHighlighted={() => setHighlightPostId(null)} />
        ) : showSearch ? (
          <ProfileSearch />
        ) : (
          <>
            {isEditing ? (
              <ShowcaseEditor
                items={showcaseItems}
                onItemsChange={(items) => {
                  setShowcaseItems(items)
                  handleProfileUpdate({ showcaseItems: items })
                }}
                profilePicture={profileData.profilePicture}
                profileName={profileData.profileName}
                profileDescription={profileData.profileDescription}
                onProfileChange={(data) => {
                  setProfileData(data)
                  handleProfileUpdate(data)
                }}
                layout={currentLayout}
                onLayoutChange={(layout) => {
                  setCurrentLayout(layout)
                  handleProfileUpdate({ layout })
                }}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={(color) => {
                  setBackgroundColor(color)
                  handleProfileUpdate({ backgroundColor: color })
                }}
                backgroundImage={backgroundImage}
                onBackgroundImageChange={(image) => {
                  setBackgroundImage(image)
                  handleProfileUpdate({ backgroundImage: image })
                }}
                contentBoxColor={contentBoxColor}
                onContentBoxColorChange={(color) => {
                  setContentBoxColor(color)
                  handleProfileUpdate({ contentBoxColor: color })
                }}
                contentBoxTrimColor={contentBoxTrimColor}
                onContentBoxTrimColorChange={(color) => {
                  setContentBoxTrimColor(color)
                  handleProfileUpdate({ contentBoxTrimColor: color })
                }}
                profileInfoColor={profileInfoColor}
                onProfileInfoColorChange={(color) => {
                  setProfileInfoColor(color)
                  handleProfileUpdate({ profileInfoColor: color })
                }}
                profileInfoTrimColor={profileInfoTrimColor}
                onProfileInfoTrimColorChange={(color) => {
                  setProfileInfoTrimColor(color)
                  handleProfileUpdate({ profileInfoTrimColor: color })
                }}
                textColor={textColor}
                onTextColorChange={(color) => {
                  setTextColor(color)
                  handleProfileUpdate({ textColor: color })
                }}
                friends={friends}
                onFriendsChange={handleFriendsChange}
                theme={currentTheme}
                onThemeChange={(theme) => {
                  setCurrentTheme(theme)
                  handleProfileUpdate({ theme })
                }}
                resumeFile={resumeFile}
                onResumeFileChange={(file) => {
                  setResumeFile(file)
                  handleProfileUpdate({ resumeFile: file })
                }}
                userEmail={user?.email || ""}
              />
            ) : (
              <ProfileShowcase
                items={showcaseItems}
                profilePicture={profileData.profilePicture}
                profileName={profileData.profileName}
                profileDescription={profileData.profileDescription}
                layout={currentLayout}
                backgroundColor={backgroundColor}
                backgroundImage={backgroundImage}
                contentBoxColor={contentBoxColor}
                contentBoxTrimColor={contentBoxTrimColor}
                profileInfoColor={profileInfoColor}
                profileInfoTrimColor={profileInfoTrimColor}
                textColor={textColor}
                friends={friends}
                resumeFile={resumeFile}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
