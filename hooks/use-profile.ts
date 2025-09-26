"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { getUserProfile, saveUserProfile, type UserProfile } from "@/lib/firestore"

export function useProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load user profile when user changes
  useEffect(() => {
    async function loadProfile() {
      if (authLoading) {
        return
      }

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("[v0] Loading profile for user:", user.uid)

        const userProfile = await getUserProfile(user.uid)

        if (userProfile) {
          console.log("[v0] Profile loaded successfully")
          setProfile(userProfile)
        } else {
          console.log("[v0] No profile found, creating default profile")
          // Create default profile for new user
          const defaultProfile: Partial<UserProfile> = {
            userId: user.uid,
            email: user.email || "",
            profileName: "Professional",
            profileDescription:
              "Welcome to my profile! I'm passionate about creating and sharing content with the community.",
            profilePicture: "/professional-profile-avatar.png",
            layout: "grid",
            backgroundColor: "#ffffff",
            backgroundImage: "",
            contentBoxColor: "#ffffff",
            contentBoxTrimColor: "#6b7280",
            theme: "light-business",
            showcaseItems: [
              {
                id: "1",
                type: "image",
                content: "/creative-workspace-setup.jpg",
                title: "My Workspace",
                description: "A look at my creative workspace",
              },
              {
                id: "2",
                type: "text",
                content: "Welcome to my profile! I'm passionate about creating and sharing content with the community.",
                title: "About Me",
                description: "",
              },
              {
                id: "3",
                type: "video",
                content: "/video-thumbnail.png",
                title: "Latest Project",
                description: "My recent work and highlights",
              },
              {
                id: "4",
                type: "image",
                content: "/creative-workspace-setup.jpg",
                title: "Featured Work",
                description: "One of my favorite projects",
              },
              {
                id: "5",
                type: "text",
                content:
                  "I specialize in creating innovative solutions and bringing creative ideas to life through technology.",
                title: "Skills & Expertise",
                description: "",
              },
              {
                id: "6",
                type: "image",
                content: "/creative-workspace-setup.jpg",
                title: "Recent Achievement",
                description: "A milestone I'm proud of",
              },
              {
                id: "7",
                type: "text",
                content: "Always learning and exploring new technologies to stay at the forefront of innovation.",
                title: "Continuous Learning",
                description: "",
              },
              {
                id: "8",
                type: "image",
                content: "/creative-workspace-setup.jpg",
                title: "Portfolio Highlight",
                description: "Another project I'm proud to showcase",
              },
            ],
            resumeFile: "",
            isPublic: true,
          }

          await saveUserProfile(user.uid, defaultProfile)
          const newProfile = await getUserProfile(user.uid)
          if (newProfile) {
            console.log("[v0] Default profile created successfully")
            setProfile(newProfile)
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, authLoading])

  // Save profile changes
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      setSaving(true)
      console.log("[v0] Updating profile with:", updates)

      await saveUserProfile(user.uid, updates)

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      console.log("[v0] Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
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
