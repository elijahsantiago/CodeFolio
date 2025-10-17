"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, User, AlertCircle, Shield } from "lucide-react"
import { searchProfiles, getPublicProfiles, type UserProfile } from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"

interface ProfileSearchProps {
  className?: string
}

export function ProfileSearch({ className }: ProfileSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [publicProfiles, setPublicProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const isAdmin = user?.email === "e.santiago.e1@gmail.com" || user?.email === "gabeasosa@gmail.com"

  useEffect(() => {
    setFirebaseAvailable(isFirebaseConfigured())
  }, [])

  // Load public profiles on component mount
  useEffect(() => {
    if (!firebaseAvailable) return

    async function loadPublicProfiles() {
      try {
        const profiles = await getPublicProfiles(12)
        setPublicProfiles(profiles)
      } catch (error) {
        console.error("Error loading public profiles:", error)
      }
    }

    loadPublicProfiles()
  }, [firebaseAvailable])

  const handleSearch = async () => {
    if (!firebaseAvailable) return

    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Searching for:", searchTerm)
      const results = await searchProfiles(searchTerm)
      console.log("[v0] Search results:", results.length)
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

  const viewProfile = (profile: UserProfile) => {
    router.push(`/profile/${profile.id}`)
  }

  const displayProfiles = searchTerm.trim() ? searchResults : publicProfiles

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

  return (
    <div className={className}>
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search for portfolios by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 h-12 text-base text-foreground rounded-xl border-2 shadow-sm focus:shadow-md transition-shadow"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} size="lg" className="h-12 px-8 rounded-xl shadow-sm">
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {searchTerm.trim() && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-foreground">Search Results ({searchResults.length})</h3>
        </div>
      )}

      {!searchTerm.trim() && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-foreground">Discover Portfolios</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayProfiles.map((profile) => {
          const isAdminProfile = profile.email === "e.santiago.e1@gmail.com" || profile.email === "gabeasosa@gmail.com"

          return (
            <Card
              key={profile.id}
              className="hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-hidden rounded-2xl border-2"
              onClick={() => viewProfile(profile)}
            >
              <div
                className="h-72 relative flex flex-col justify-end p-6"
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
                <div className="relative z-10 flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-2xl">
                    <AvatarImage src={profile.profilePicture || "/placeholder.svg"} alt={profile.profileName} />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-xl truncate text-white drop-shadow-lg">{profile.profileName}</h4>
                      {isAdminProfile && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-lg blur-sm opacity-75 animate-pulse" />
                          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-lg shadow-xl border-2 border-white/40">
                            <Shield className="h-3.5 w-3.5 text-white drop-shadow-lg" />
                            <span className="text-xs font-bold text-white drop-shadow-lg tracking-wide">ADMIN</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className="text-xs bg-white text-black font-semibold shadow-md">{profile.layout}</Badge>
                      <Badge className="text-xs bg-black/80 text-white border-2 border-white/40 font-semibold shadow-md">
                        {profile.showcaseItems.length} items
                      </Badge>
                    </div>
                  </div>
                </div>

                {isAdmin && !isAdminProfile && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4 z-20 gap-2 shadow-lg"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (confirm(`Are you sure you want to delete ${profile.profileName}'s profile?`)) {
                        try {
                          const { adminDeleteProfile } = await import("@/lib/firestore")
                          await adminDeleteProfile(user?.email || "", profile.id)
                          alert("Profile deleted successfully")
                          window.location.reload()
                        } catch (error) {
                          console.error("Error deleting profile:", error)
                          alert("Failed to delete profile")
                        }
                      }
                    }}
                  >
                    Delete Profile
                  </Button>
                )}
              </div>

              <CardContent className="p-6">
                <p className="text-sm text-foreground/80 mb-5 line-clamp-2 leading-relaxed">
                  {profile.profileDescription}
                </p>

                {profile.showcaseItems.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Portfolio Preview</p>
                    <div className="grid grid-cols-2 gap-3">
                      {profile.showcaseItems.slice(0, 4).map((item, index) => (
                        <div
                          key={item.id}
                          className="aspect-square bg-muted rounded-xl overflow-hidden relative group/item shadow-sm"
                        >
                          {item.type === "image" && item.content ? (
                            <img
                              src={item.content || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                              <div className="text-center p-3">
                                <p className="text-xs font-semibold truncate text-foreground">{item.title}</p>
                                {item.type === "text" && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.content.substring(0, 50)}...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {index === 3 && profile.showcaseItems.length > 4 && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                              <span className="text-white font-semibold text-sm">
                                +{profile.showcaseItems.length - 4} more
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
        })}
      </div>

      {displayProfiles.length === 0 && searchTerm.trim() && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
          <p className="text-muted-foreground">No profiles found matching "{searchTerm}"</p>
        </div>
      )}

      {displayProfiles.length === 0 && !searchTerm.trim() && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No public profiles yet</h3>
          <p className="text-muted-foreground">Be the first to create a public profile!</p>
        </div>
      )}
    </div>
  )
}
