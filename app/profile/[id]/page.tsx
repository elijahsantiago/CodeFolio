"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { ProfileShowcase } from "@/components/profile-showcase"
import { getUserProfile, type UserProfile } from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"

export default function ProfileViewPage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)

  useEffect(() => {
    setFirebaseAvailable(isFirebaseConfigured())
  }, [])

  useEffect(() => {
    if (!firebaseAvailable || !params.id) return

    async function loadProfile() {
      try {
        setLoading(true)
        const profileData = await getUserProfile(params.id as string)
        if (profileData && profileData.isPublic) {
          setProfile(profileData)
        } else {
          setError("Profile not found or not public")
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [firebaseAvailable, params.id])

  if (!firebaseAvailable) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Profile Unavailable</h1>
          <p className="text-muted-foreground mb-4">
            Profile viewing requires Firebase configuration. Please set up your Firebase environment variables.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The profile you're looking for doesn't exist or is not public."}
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const pageBackgroundStyle = {
    backgroundColor: profile.backgroundColor || "#ffffff",
    ...(profile.backgroundImage && {
      backgroundImage: `url(${profile.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }),
  }

  return (
    <div className="min-h-screen" style={pageBackgroundStyle}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={() => router.push("/?discover=true")} variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Button>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold">{profile.profileName}'s Portfolio</h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>

        <ProfileShowcase
          items={profile.showcaseItems}
          profilePicture={profile.profilePicture}
          profileName={profile.profileName}
          profileDescription={profile.profileDescription}
          layout={profile.layout}
          backgroundColor="transparent" // Set to transparent since page background handles it
          backgroundImage="" // Set to empty since page background handles it
          contentBoxColor={profile.contentBoxColor}
          contentBoxTrimColor={profile.contentBoxTrimColor}
          friends={[]} // Don't show friends for other users
          resumeFile={profile.resumeFile}
        />
      </div>
    </div>
  )
}
