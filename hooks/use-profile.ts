"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { getUserProfile, saveUserProfile, type UserProfile } from "@/lib/firestore"
import { isFirebaseConfigured } from "@/lib/firebase"

const PROFILE_STORAGE_KEY = "userProfile"

function saveProfileToLocalStorage(userId: string, profile: UserProfile) {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}")
    profiles[userId] = profile
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
    console.log("[v0] Profile saved to local storage")
  } catch (error) {
    console.error("Error saving profile to local storage:", error)
  }
}

function getProfileFromLocalStorage(userId: string): UserProfile | null {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}")
    return profiles[userId] || null
  } catch (error) {
    console.error("Error loading profile from local storage:", error)
    return null
  }
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("[v0] Loading profile for user:", user.uid)

        if (isFirebaseConfigured()) {
          try {
            const userProfile = await getUserProfile(user.uid)

            if (userProfile) {
              console.log("[v0] Profile loaded successfully from Firebase")
              saveProfileToLocalStorage(user.uid, userProfile)
              setProfile(userProfile)
              setLoading(false)
              return
            } else {
              console.log("[v0] No profile found in Firebase")
              // Check if we have a local profile to sync
              const localProfile = getProfileFromLocalStorage(user.uid)
              if (localProfile) {
                console.log("[v0] Found local profile, syncing to Firebase")
                try {
                  await saveUserProfile(user.uid, localProfile)
                  console.log("[v0] Local profile synced to Firebase")
                  setProfile(localProfile)
                  setLoading(false)
                  return
                } catch (syncError: any) {
                  if (syncError.message === "FIREBASE_PERMISSIONS_ERROR") {
                    console.log("[v0] Firebase permissions not configured, using local profile")
                    setProfile(localProfile)
                    setLoading(false)
                    return
                  }
                  throw syncError
                }
              }

              // No profile exists anywhere - this is a new user who needs setup
              console.log("[v0] New user detected - profile setup required")
              setProfile(null)
              setLoading(false)
              return
            }
          } catch (error: any) {
            if (error.message === "FIREBASE_PERMISSIONS_ERROR") {
              console.log("[v0] Firebase permissions not configured, falling back to local storage")
              const localProfile = getProfileFromLocalStorage(user.uid)
              if (localProfile) {
                console.log("[v0] Using local profile")
                setProfile(localProfile)
                setLoading(false)
                return
              }
            } else {
              throw error
            }
          }
        }

        console.log("[v0] Checking local storage for existing profile")
        const localProfile = getProfileFromLocalStorage(user.uid)
        if (localProfile) {
          console.log("[v0] Profile loaded from local storage")
          setProfile(localProfile)
          setLoading(false)
          return
        }

        console.log("[v0] No existing profile found - new user setup required")
        setProfile(null)
        setLoading(false)
      } catch (error: any) {
        console.error("Error loading profile:", error)
        console.log("[v0] Profile loading failed, checking local storage")

        const localProfile = getProfileFromLocalStorage(user.uid)
        if (localProfile) {
          console.log("[v0] Using local profile as fallback")
          setProfile(localProfile)
        } else {
          console.log("[v0] No profile available - setup required")
          setProfile(null)
        }
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Save profile changes
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      setSaving(true)
      console.log("[v0] Updating profile with:", updates)

      if (!profile) {
        const newProfile: UserProfile = {
          id: user.uid,
          userId: user.uid,
          email: user.email || "",
          profileName: updates.profileName || "Professional",
          profileDescription: updates.profileDescription || "Welcome to my profile!",
          profilePicture: updates.profilePicture || "/professional-profile-avatar.png",
          layout: "grid",
          backgroundColor: "#ffffff",
          backgroundImage: "",
          contentBoxColor: "#ffffff",
          contentBoxTrimColor: "#6b7280",
          theme: "light-business",
          showcaseItems: [
            {
              id: "1",
              type: "text",
              content:
                updates.profileDescription ||
                "Welcome to my profile! I'm excited to share my work and connect with others.",
              title: "About Me",
              description: "",
            },
          ],
          resumeFile: "",
          isPublic: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          searchKeywords: [],
          ...updates,
        }

        setProfile(newProfile)
        saveProfileToLocalStorage(user.uid, newProfile)

        // Try to save to Firebase
        if (isFirebaseConfigured()) {
          try {
            await saveUserProfile(user.uid, newProfile)
            console.log("[v0] New profile saved to Firebase")
          } catch (error: any) {
            if (error.message !== "FIREBASE_PERMISSIONS_ERROR") {
              console.error("Error saving new profile to Firebase:", error)
            }
            console.log("[v0] New profile saved locally")
          }
        }
        return
      }

      // Update existing profile
      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
      saveProfileToLocalStorage(user.uid, updatedProfile)

      // Try to save to Firebase if configured
      if (isFirebaseConfigured()) {
        await saveUserProfile(user.uid, updates)
        console.log("[v0] Profile saved to Firebase")
      } else {
        console.log("[v0] Firebase not configured, profile updated locally only")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      console.log("[v0] Profile update failed, but local changes preserved")
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    loading,
    saving,
    updateProfile,
  }
}
