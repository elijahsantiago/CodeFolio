"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfileShowcase } from "@/components/profile-showcase"
import { ShowcaseEditor } from "@/components/showcase-editor"
import { ProfileSearch } from "@/components/profile-search"
import { Button } from "@/components/ui/button"
import { Edit, Eye, LogOut, User, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const { user, loading: authLoading, logout } = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useProfile()
  const router = useRouter()

  const [currentLayout, setCurrentLayout] = useState<"default" | "minimal" | "grid" | "masonry" | "spotlight">("grid")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [backgroundImage, setBackgroundImage] = useState("")
  const [contentBoxColor, setContentBoxColor] = useState("#ffffff")
  const [contentBoxTrimColor, setContentBoxTrimColor] = useState("#6b7280")
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
    if (profile) {
      setCurrentLayout(profile.layout)
      setBackgroundColor(profile.backgroundColor)
      setBackgroundImage(profile.backgroundImage)
      setContentBoxColor(profile.contentBoxColor)
      setContentBoxTrimColor(profile.contentBoxTrimColor)
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

  const handleProfileUpdate = async (updates: any) => {
    if (profile && updateProfile) {
      try {
        await updateProfile(updates)
      } catch (error) {
        console.error("Error updating profile:", error)
      }
    }
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

  return (
    <div className={`min-h-screen bg-background ${currentTheme}`}>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant={showSearch ? "default" : "outline"} size="sm" onClick={() => setShowSearch(!showSearch)}>
              {showSearch ? "My Profile" : "Discover Profiles"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {showSearch ? (
          <ProfileSearch />
        ) : (
          <>
            <div className="fixed top-4 right-4 z-50">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "secondary" : "default"}
                size="sm"
                className="gap-2 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary-foreground/20 transition-all duration-300"
              >
                {isEditing ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview
                  </>
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </div>

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
                friends={friends}
                onFriendsChange={setFriends}
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
