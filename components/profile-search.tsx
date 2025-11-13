"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, User, AlertCircle, Shield, Loader2, TrendingUp, Users, Sparkles } from "lucide-react"
import {
  searchProfileCards,
  getPublicProfileCards,
  getTrendingProfiles,
  getRecommendedProfiles,
  getUserProfile,
  type ProfileCard,
} from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { VerificationBadgesDisplay } from "@/components/verification-badge"

interface ProfileSearchProps {
  className?: string
}

export function ProfileSearch({ className }: ProfileSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<ProfileCard[]>([])
  const [publicProfiles, setPublicProfiles] = useState<ProfileCard[]>([])
  const [trendingProfiles, setTrendingProfiles] = useState<ProfileCard[]>([])
  const [recommendedProfiles, setRecommendedProfiles] = useState<ProfileCard[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(false)
  const [profileBadges, setProfileBadges] = useState<Record<string, any[]>>({})
  const router = useRouter()
  const { user } = useAuth()

  const isAdmin = user?.email === "e.santiago.e1@gmail.com" || user?.email === "gabeasosa@gmail.com"

  useEffect(() => {
    setFirebaseAvailable(isFirebaseConfigured())
  }, [])

  useEffect(() => {
    if (!firebaseAvailable) return

    async function loadInitialProfiles() {
      try {
        setLoading(true)

        // Load all profile types in parallel
        const [publicResult, trending, recommended] = await Promise.all([
          getPublicProfileCards(12, isAdmin),
          getTrendingProfiles(3, isAdmin),
          user ? getRecommendedProfiles(user.uid, 6, isAdmin) : Promise.resolve([]),
        ])

        setPublicProfiles(publicResult.profiles)
        setLastDoc(publicResult.lastDoc)
        setHasMore(publicResult.hasMore)
        setTrendingProfiles(trending)
        setRecommendedProfiles(recommended)

        const allProfiles = [...publicResult.profiles, ...trending, ...recommended]
        const badgesMap: Record<string, any[]> = {}

        await Promise.all(
          allProfiles.map(async (profile) => {
            try {
              const fullProfile = await getUserProfile(profile.userId)
              if (fullProfile?.verificationBadges) {
                badgesMap[profile.userId] = fullProfile.verificationBadges
              }
            } catch (error) {
              console.error(`Error loading badges for ${profile.userId}:`, error)
            }
          }),
        )

        setProfileBadges(badgesMap)
      } catch (error) {
        console.error("Error loading profiles:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialProfiles()
  }, [firebaseAvailable, isAdmin, user])

  useEffect(() => {
    if (!firebaseAvailable) return

    // If search term is empty, clear results and return
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    // Debounce the search - wait 300ms after user stops typing
    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchProfileCards(searchTerm, 10, isAdmin)
        setSearchResults(results)
      } catch (error) {
        console.error("Error searching profiles:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    // Cleanup function to cancel the timeout if searchTerm changes again
    return () => clearTimeout(timeoutId)
  }, [searchTerm, firebaseAvailable, isAdmin])

  const handleLoadMore = async () => {
    if (!firebaseAvailable || !hasMore || loadingMore) return

    setLoadingMore(true)
    try {
      const result = await getPublicProfileCards(12, isAdmin, lastDoc)
      setPublicProfiles((prev) => [...prev, ...result.profiles])
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)

      const badgesMap: Record<string, any[]> = { ...profileBadges }

      await Promise.all(
        result.profiles.map(async (profile) => {
          try {
            const fullProfile = await getUserProfile(profile.userId)
            if (fullProfile?.verificationBadges) {
              badgesMap[profile.userId] = fullProfile.verificationBadges
            }
          } catch (error) {
            console.error(`Error loading badges for ${profile.userId}:`, error)
          }
        }),
      )

      setProfileBadges(badgesMap)
    } catch (error) {
      console.error("Error loading more profiles:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSearch = async () => {
    if (!firebaseAvailable) return

    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await searchProfileCards(searchTerm, 10, isAdmin)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching profiles:", error)
      alert("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const viewProfile = (profile: ProfileCard) => {
    router.push(`/profile/${profile.id}`)
  }

  const renderProfileCard = (profile: ProfileCard) => {
    const isAdminProfile = profile.email === "e.santiago.e1@gmail.com" || profile.email === "gabeasosa@gmail.com"
    const badges = profileBadges[profile.userId] || []

    return (
      <Card
        key={profile.id}
        className="hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-hidden rounded-2xl border-2"
        onClick={() => viewProfile(profile)}
      >
        <div
          className="h-40 md:h-72 relative flex flex-col justify-end p-3 md:p-6"
          style={{
            backgroundColor: profile.backgroundColor,
            ...(profile.backgroundImage && {
              backgroundImage: `url(${profile.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }),
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />
          <div className="relative z-10 flex items-center gap-2 md:gap-4">
            <Avatar className="h-12 w-12 md:h-20 md:w-20 ring-2 md:ring-4 ring-white/30 shadow-2xl">
              <AvatarImage src={profile.profilePicture || "/placeholder.svg"} alt={profile.profileName} />
              <AvatarFallback>
                <User className="h-6 w-6 md:h-10 md:w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2 flex-wrap">
                <h4 className="font-bold text-base md:text-xl truncate text-white drop-shadow-lg">
                  {profile.profileName}
                </h4>
                {isAdminProfile && (
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
                    <div className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2.5 py-0.5 md:py-1.5 bg-white/95 backdrop-blur-sm rounded-lg border-2 rainbow-outline shadow-xl">
                      <Shield className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-gray-900" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-900 tracking-wide">ADMIN</span>
                    </div>
                  </div>
                )}
                {badges.length > 0 && (
                  <div className="flex items-center">
                    <VerificationBadgesDisplay badges={badges} size="sm" />
                  </div>
                )}
              </div>
              <div className="flex gap-1 md:gap-2">
                <Badge className="text-[10px] md:text-xs bg-white text-black font-semibold shadow-md px-1.5 md:px-2 py-0 md:py-0.5">
                  {profile.layout}
                </Badge>
                <Badge className="text-[10px] md:text-xs bg-black/80 text-white border-2 border-white/40 font-semibold shadow-md px-1.5 md:px-2 py-0 md:py-0.5">
                  {profile.showcaseItemCount} items
                </Badge>
              </div>
            </div>
          </div>

          {isAdmin && !isAdminProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 md:top-4 right-2 md:right-4 z-20 gap-2 opacity-0 hover:opacity-100 transition-opacity bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-lg text-xs md:text-sm"
              onClick={async (e) => {
                e.stopPropagation()
                if (confirm(`Are you sure you want to delete ${profile.profileName}'s profile?`)) {
                  try {
                    const { adminDeleteProfile } = await import("@/lib/firestore")
                    await adminDeleteProfile(user?.email || "", profile.id)
                    alert("Profile deleted successfully")
                    window.location.reload()
                  } catch (error: any) {
                    console.error("Error deleting profile:", error)
                    if (error.message?.includes("Firestore security rules")) {
                      alert(
                        "Admin functionality requires Firestore security rules update.\n\n" +
                          "Please follow these steps:\n" +
                          "1. Open Firebase Console\n" +
                          "2. Go to Firestore Database → Rules\n" +
                          "3. Copy the rules from CONNECTION_SETUP.md\n" +
                          "4. Publish the updated rules\n\n" +
                          "See CONNECTION_SETUP.md in your project for detailed instructions.",
                      )
                    } else {
                      alert(`Failed to delete profile: ${error.message}`)
                    }
                  }
                }
              }}
            >
              Delete
            </Button>
          )}

          {isAdmin && !profile.isPublic && (
            <Badge className="absolute top-2 md:top-4 left-2 md:left-4 z-20 bg-yellow-500 text-black font-semibold shadow-lg text-[10px] md:text-xs">
              Non-Public
            </Badge>
          )}
        </div>

        <CardContent className="p-3 md:p-6">
          <p className="text-xs md:text-sm text-foreground/80 mb-3 md:mb-5 line-clamp-2 leading-relaxed">
            {profile.profileDescription}
          </p>

          {profile.previewImages.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              <p className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-wider">
                Portfolio Preview
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {profile.previewImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-muted rounded-lg md:rounded-xl overflow-hidden relative group/item shadow-sm"
                  >
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    {index === 3 && profile.showcaseItemCount > 4 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-semibold text-xs md:text-sm">
                          +{profile.showcaseItemCount - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!firebaseAvailable) {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Search Unavailable</p>
            <p className="text-sm text-yellow-700">
              Profile search requires Firebase configuration. Please set up your Firebase environment variables to
              enable this feature.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const displayProfiles = searchTerm.trim() ? searchResults : publicProfiles

  return (
    <div className={className}>
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Discover Amazing Portfolios</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Explore creative work from talented individuals and connect with professionals in your field
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
              <Input
                placeholder="Search for portfolios by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base text-foreground rounded-xl border-2 shadow-sm focus:shadow-md transition-shadow"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              size="lg"
              className="h-10 md:h-12 px-6 md:px-8 rounded-xl shadow-sm text-sm md:text-base"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {!searchTerm.trim() && trendingProfiles.length > 0 && (
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Trending Portfolios</h3>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mb-4">
            Most active and popular portfolios right now
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {trendingProfiles.map((profile) => renderProfileCard(profile))}
          </div>
        </div>
      )}

      {!searchTerm.trim() && recommendedProfiles.length > 0 && (
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Recommended for You</h3>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mb-4">Connect with professionals in your network</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {recommendedProfiles.map((profile) => renderProfileCard(profile))}
          </div>
        </div>
      )}

      {searchTerm.trim() && (
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Search Results ({searchResults.length})</h3>
          </div>
        </div>
      )}

      {!searchTerm.trim() && (
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            <h3 className="text-xl md:text-2xl font-bold text-foreground">All Portfolios</h3>
          </div>
        </div>
      )}

      {loading && displayProfiles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {displayProfiles.map((profile) => renderProfileCard(profile))}
          </div>

          {!searchTerm.trim() && hasMore && (
            <div className="flex justify-center mt-6 md:mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="lg"
                variant="outline"
                className="px-6 md:px-8 rounded-xl bg-transparent text-sm md:text-base"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

      {displayProfiles.length === 0 && searchTerm.trim() && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
          <p className="text-muted-foreground">No profiles found matching "{searchTerm}"</p>
        </div>
      )}

      {displayProfiles.length === 0 && !searchTerm.trim() && !loading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No public profiles yet</h3>
          <p className="text-muted-foreground">Be the first to create a public profile!</p>
        </div>
      )}
    </div>
  )
}
