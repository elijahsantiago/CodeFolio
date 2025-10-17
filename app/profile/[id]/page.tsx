"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, AlertCircle, UserPlus, UserCheck } from "lucide-react"
import { ProfileShowcase } from "@/components/profile-showcase"
import {
  getUserProfile,
  sendConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  hasPendingRequest,
  type UserProfile,
} from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"

export default function ProfileViewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { profile: currentUserProfile, updateProfile } = useProfile()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)

  useEffect(() => {
    setFirebaseAvailable(isFirebaseConfigured())
  }, [])

  useEffect(() => {
    if (!firebaseAvailable || !params.id) return

    async function loadProfile() {
      try {
        setLoading(true)
        console.log("[v0] Loading profile for user:", params.id)
        const profileData = await getUserProfile(params.id as string)
        if (profileData && profileData.isPublic) {
          console.log("[v0] Profile loaded successfully")
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

  useEffect(() => {
    if (currentUserProfile && profile && user) {
      const connections = currentUserProfile.connections || []
      setIsConnected(connections.some((conn) => conn.userId === profile.userId))

      // Check if request was sent using the new hasPendingRequest function
      hasPendingRequest(user.uid, profile.userId).then((hasPending) => {
        setRequestSent(hasPending)
      })
    }
  }, [currentUserProfile, profile, user])

  const handleConnectionToggle = async () => {
    if (!user || !currentUserProfile || !profile) return

    try {
      setConnectLoading(true)
      console.log("[v0] Sending connection request to:", profile.userId)

      if (isConnected) {
        // Remove connection
        await removeConnection(user.uid, profile.userId)
        setIsConnected(false)
        if (updateProfile) {
          const updatedConnections = (currentUserProfile.connections || []).filter(
            (conn) => conn.userId !== profile.userId,
          )
          await updateProfile({ connections: updatedConnections })
        }
      } else if (requestSent) {
        // Cancel request
        await cancelConnectionRequest(user.uid, profile.userId)
        setRequestSent(false)
      } else {
        // Send connection request
        await sendConnectionRequest(user.uid, currentUserProfile, profile.userId)
        setRequestSent(true)
      }
    } catch (error) {
      console.error("Error toggling connection:", error)
    } finally {
      setConnectLoading(false)
    }
  }

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

  const isOwnProfile = user && user.uid === profile.userId

  return (
    <div className="min-h-screen" style={pageBackgroundStyle}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button onClick={() => router.push("/?discover=true")} variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Button>

          {!isOwnProfile && user && (
            <Button
              onClick={handleConnectionToggle}
              disabled={connectLoading}
              variant={isConnected ? "outline" : "default"}
              size="sm"
              className="gap-2"
            >
              {connectLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Connected
                </>
              ) : requestSent ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Request Sent
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          )}
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold">{profile.profileName}'s Portfolio</h1>
        </div>

        <ProfileShowcase
          items={profile.showcaseItems}
          profilePicture={profile.profilePicture}
          profileName={profile.profileName}
          profileDescription={profile.profileDescription}
          layout={profile.layout}
          backgroundColor="transparent"
          backgroundImage=""
          contentBoxColor={profile.contentBoxColor}
          contentBoxTrimColor={profile.contentBoxTrimColor}
          profileInfoColor={profile.profileInfoColor}
          profileInfoTrimColor={profile.profileInfoTrimColor}
          textColor={profile.textColor}
          friends={
            profile.connections?.map((conn) => ({
              id: conn.userId,
              name: conn.profileName,
              avatar: conn.profilePicture,
              status: "offline" as const,
              lastSeen: new Date(conn.connectedAt).toLocaleDateString(),
            })) || []
          }
          resumeFile={profile.resumeFile}
          isViewOnly={true}
        />
      </div>
    </div>
  )
}
