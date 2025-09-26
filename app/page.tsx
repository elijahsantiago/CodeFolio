"use client"

import { useState, useEffect } from "react"
import { ProfileShowcase } from "@/components/profile-showcase"
import { ShowcaseEditor } from "@/components/showcase-editor"
import { AuthModal } from "@/components/auth-modal"
import { ProfileSearch } from "@/components/profile-search"
import { Button } from "@/components/ui/button"
import { Edit, Eye, LogIn, LogOut, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QuickProfileSetup } from "@/components/quick-profile-setup"

function LoginScreen({ onShowAuth }: { onShowAuth: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome to CodeFolio</h1>
          <p className="text-muted-foreground">
            Create and showcase your professional portfolio with our powerful profile builder.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={onShowAuth} size="lg" className="w-full">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In / Create Account
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>New to CodeFolio? Create an account to get started.</p>
            <p>Already have an account? Sign in to continue.</p>
          </div>
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-3">Features:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Customizable portfolio layouts</li>
            <li>• Resume upload and showcase</li>
            <li>• Multiple theme options</li>
            <li>• Searchable public profiles</li>
            <li>• Professional networking</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const { user, loading: authLoading, logout } = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useProfile()

  // All profile data now comes from the database via useProfile hook

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

  useEffect(() => {
    if (user && !profileLoading && !profile) {
      console.log("[v0] Setting showProfileSetup to true for new user")
      setShowProfileSetup(true)
    }
  }, [user, profile, profileLoading])

  const handleQuickProfileSetup = async (data: {
    profileName: string
    profileDescription: string
    profilePicture?: string
  }) => {
    if (!updateProfile) return

    try {
      await updateProfile({
        profileName: data.profileName,
        profileDescription: data.profileDescription,
        profilePicture: data.profilePicture || "/professional-profile-avatar.png",
      })
      setShowProfileSetup(false)
    } catch (error) {
      console.error("Error setting up profile:", error)
    }
  }

  const handleProfileUpdate = async (updates: any) => {
    if (updateProfile) {
      try {
        await updateProfile(updates)
      } catch (error) {
        console.error("Error updating profile:", error)
      }
    }
  }

  useEffect(() => {
    if (profile) {
      const htmlElement = document.documentElement
      htmlElement.classList.remove("dark", "light-business", "dark-business", "business-casual")
      if (profile.theme) {
        htmlElement.classList.add(profile.theme)
      }
    }
  }, [profile])

  const handleLogout = async () => {
    try {
      await logout()
      setIsEditing(false)
      setShowSearch(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginScreen onShowAuth={() => setShowAuthModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
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
            {profile ? (
              <>
                <div className="fixed top-4 right-4 z-50">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "secondary" : "default"}
                    size="sm"
                    className="gap-2 shadow-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-primary hover:text-primary-foreground transition-all duration-300"
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
                    items={profile.showcaseItems}
                    onItemsChange={(items) => handleProfileUpdate({ showcaseItems: items })}
                    profilePicture={profile.profilePicture}
                    profileName={profile.profileName}
                    profileDescription={profile.profileDescription}
                    onProfileChange={(data) => handleProfileUpdate(data)}
                    layout={profile.layout}
                    onLayoutChange={(layout) => handleProfileUpdate({ layout })}
                    backgroundColor={profile.backgroundColor}
                    onBackgroundColorChange={(color) => handleProfileUpdate({ backgroundColor: color })}
                    backgroundImage={profile.backgroundImage}
                    onBackgroundImageChange={(image) => handleProfileUpdate({ backgroundImage: image })}
                    contentBoxColor={profile.contentBoxColor}
                    onContentBoxColorChange={(color) => handleProfileUpdate({ contentBoxColor: color })}
                    contentBoxTrimColor={profile.contentBoxTrimColor}
                    onContentBoxTrimColorChange={(color) => handleProfileUpdate({ contentBoxTrimColor: color })}
                    friends={friends}
                    onFriendsChange={setFriends}
                    theme={profile.theme}
                    onThemeChange={(theme) => handleProfileUpdate({ theme })}
                    resumeFile={profile.resumeFile}
                    onResumeFileChange={(file) => handleProfileUpdate({ resumeFile: file })}
                  />
                ) : (
                  <ProfileShowcase
                    items={profile.showcaseItems}
                    profilePicture={profile.profilePicture}
                    profileName={profile.profileName}
                    profileDescription={profile.profileDescription}
                    layout={profile.layout}
                    backgroundColor={profile.backgroundColor}
                    backgroundImage={profile.backgroundImage}
                    contentBoxColor={profile.contentBoxColor}
                    contentBoxTrimColor={profile.contentBoxTrimColor}
                    friends={friends}
                    resumeFile={profile.resumeFile}
                  />
                )}
              </>
            ) : (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Welcome to CodeFolio!</h2>
                  <p className="text-muted-foreground">Let's set up your profile to get started.</p>
                  <Button onClick={() => setShowProfileSetup(true)}>Set Up Profile</Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome! Set up your profile</DialogTitle>
            <DialogDescription>Let's personalize your profile to make it uniquely yours.</DialogDescription>
          </DialogHeader>
          <QuickProfileSetup onComplete={handleQuickProfileSetup} onSkip={() => setShowProfileSetup(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
