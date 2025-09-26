"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, User, AlertCircle } from "lucide-react"
import { searchProfiles, getPublicProfiles, type UserProfile } from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"

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
      const results = await searchProfiles(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching profiles:", error)
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
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for portfolios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {searchTerm.trim() && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Search Results ({searchResults.length})</h3>
        </div>
      )}

      {!searchTerm.trim() && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Discover Portfolios</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayProfiles.map((profile) => (
          <Card
            key={profile.id}
            className="hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
            onClick={() => viewProfile(profile)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarImage src={profile.profilePicture || "/placeholder.svg"} alt={profile.profileName} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                    {profile.profileName}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {profile.layout}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {profile.showcaseItems.length} items
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{profile.profileDescription}</p>

              {profile.showcaseItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Portfolio Preview</p>
                  <div className="grid grid-cols-2 gap-2">
                    {profile.showcaseItems.slice(0, 4).map((item, index) => (
                      <div
                        key={item.id}
                        className="aspect-square bg-muted rounded-lg overflow-hidden relative group/item"
                      >
                        {item.type === "image" && item.content ? (
                          <img
                            src={item.content || "/placeholder.svg"}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <div className="text-center p-2">
                              <p className="text-xs font-medium truncate">{item.title}</p>
                              {item.type === "text" && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {item.content.substring(0, 50)}...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {index === 3 && profile.showcaseItems.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
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
        ))}
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
