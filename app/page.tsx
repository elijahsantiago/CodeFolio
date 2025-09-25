"use client"

import { useState, useEffect } from "react"
import { ProfileShowcase } from "@/components/profile-showcase"
import { ShowcaseEditor } from "@/components/showcase-editor"
import { Button } from "@/components/ui/button"
import { Edit, Eye } from "lucide-react"

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<"default" | "minimal" | "grid" | "masonry" | "spotlight">(
    "default",
  )
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
  ])

  useEffect(() => {
    const htmlElement = document.documentElement

    // Remove all theme classes
    htmlElement.classList.remove("dark", "light-business", "dark-business", "business-casual")

    // Apply the selected theme
    htmlElement.classList.add(currentTheme)

    if (currentTheme === "dark-business") {
      // Only sync if colors haven't been manually changed from defaults
      if (contentBoxColor === "#ffffff" && contentBoxTrimColor === "#6b7280") {
        setContentBoxColor("#1f2937")
        setContentBoxTrimColor("#374151")
      }
    } else if (currentTheme === "light-business") {
      // Reset to light defaults if switching back
      if (contentBoxColor === "#1f2937" && contentBoxTrimColor === "#374151") {
        setContentBoxColor("#ffffff")
        setContentBoxTrimColor("#6b7280")
      }
    }
  }, [currentTheme, contentBoxColor, contentBoxTrimColor])

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="fixed top-4 right-4 z-50 group">
          <div className="relative">
            {/* Icon that's always visible */}
            <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg transition-all duration-300 group-hover:bg-background/95">
              <Edit className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            {/* Full button that appears on hover */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "secondary" : "default"}
                className="gap-2 shadow-lg whitespace-nowrap"
              >
                {isEditing ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {isEditing ? (
          <ShowcaseEditor
            items={showcaseItems}
            onItemsChange={setShowcaseItems}
            profilePicture={profileData.profilePicture}
            profileName={profileData.profileName}
            profileDescription={profileData.profileDescription}
            onProfileChange={setProfileData}
            layout={currentLayout}
            onLayoutChange={setCurrentLayout}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            backgroundImage={backgroundImage}
            onBackgroundImageChange={setBackgroundImage}
            contentBoxColor={contentBoxColor}
            onContentBoxColorChange={setContentBoxColor}
            contentBoxTrimColor={contentBoxTrimColor}
            onContentBoxTrimColorChange={setContentBoxTrimColor}
            friends={friends}
            onFriendsChange={setFriends}
            theme={currentTheme}
            onThemeChange={setCurrentTheme}
            resumeFile={resumeFile}
            onResumeFileChange={setResumeFile}
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
      </main>
    </div>
  )
}
