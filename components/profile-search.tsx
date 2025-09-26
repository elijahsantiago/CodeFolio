"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, User, Eye, AlertCircle } from "lucide-react"
import { searchProfiles, getPublicProfiles, type UserProfile } from "@/lib/firestore"
import { ProfileShowcase } from "./profile-showcase"
import { isFirebaseConfigured } from "@/lib/firebase"

interface ProfileSearchProps {
  className?: string
}

export function ProfileSearch({ className }: ProfileSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [publicProfiles, setPublicProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)

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
    setSelectedProfile(profile)
    setShowProfileModal(true)
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProfiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.profilePicture || "/placeholder.svg"} alt={profile.profileName} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{profile.profileName}</h4>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{profile.profileDescription}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {profile.layout}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {profile.showcaseItems.length} items
                  </Badge>
                </div>

                <Button size="sm" variant="outline" onClick={() => viewProfile(profile)} className="gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayProfiles.length === 0 && searchTerm.trim() && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No profiles found matching "{searchTerm}"</p>
        </div>
      )}

      {displayProfiles.length === 0 && !searchTerm.trim() && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No public profiles available yet</p>
        </div>
      )}

      {/* Profile View Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProfile?.profileName}'s Portfolio</DialogTitle>
          </DialogHeader>

          {selectedProfile && (
            <div className="mt-4">
              <ProfileShowcase
                items={selectedProfile.showcaseItems}
                profilePicture={selectedProfile.profilePicture}
                profileName={selectedProfile.profileName}
                profileDescription={selectedProfile.profileDescription}
                layout={selectedProfile.layout}
                backgroundColor={selectedProfile.backgroundColor}
                backgroundImage={selectedProfile.backgroundImage}
                contentBoxColor={selectedProfile.contentBoxColor}
                contentBoxTrimColor={selectedProfile.contentBoxTrimColor}
                friends={[]} // Don't show friends for other users
                resumeFile={selectedProfile.resumeFile}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
