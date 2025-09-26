import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"

// Profile data structure
export interface UserProfile {
  id: string
  userId: string
  email: string
  profileName: string
  profileDescription: string
  profilePicture: string
  layout: "default" | "minimal" | "grid" | "masonry" | "spotlight"
  backgroundColor: string
  backgroundImage: string
  contentBoxColor: string
  contentBoxTrimColor: string
  theme: "light-business" | "dark-business" | "business-casual"
  showcaseItems: ShowcaseItem[]
  resumeFile: string
  isPublic: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  searchKeywords: string[] // For search functionality
}

export interface ShowcaseItem {
  id: string
  type: "image" | "video" | "text"
  content: string
  title: string
  description: string
}

// Create or update user profile
export async function saveUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, skipping profile save")
    return
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return
  }

  if (!userId) {
    console.warn("No user ID provided")
    return
  }

  try {
    const profileRef = doc(db, "profiles", userId)

    // Generate search keywords from profile name and description
    const searchKeywords = generateSearchKeywords(profileData.profileName || "", profileData.profileDescription || "")

    const dataToSave = {
      ...profileData,
      userId,
      searchKeywords,
      updatedAt: serverTimestamp(),
    }

    // Check if profile exists
    const profileSnap = await getDoc(profileRef)

    if (profileSnap.exists()) {
      // Update existing profile
      await updateDoc(profileRef, dataToSave)
    } else {
      // Create new profile
      await setDoc(profileRef, {
        ...dataToSave,
        createdAt: serverTimestamp(),
      })
    }
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      console.warn("Firestore permission denied - check security rules and authentication")
      return
    }
    console.error("Error saving profile:", error)
    throw error
  }
}

// Get user profile by userId
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning null profile")
    return null
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return null
  }

  if (!userId) {
    console.warn("No user ID provided")
    return null
  }

  try {
    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (profileSnap.exists()) {
      return { id: profileSnap.id, ...profileSnap.data() } as UserProfile
    }

    return null
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      console.warn("Firestore permission denied - check security rules and authentication")
      return null
    }
    console.error("Error getting profile:", error)
    throw error
  }
}

// Search profiles by keywords
export async function searchProfiles(searchTerm: string, maxResults = 10): Promise<UserProfile[]> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty search results")
    return []
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return []
  }

  try {
    const searchKeywords = searchTerm
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 0)

    if (searchKeywords.length === 0) {
      return []
    }

    const profilesRef = collection(db, "profiles")
    const q = query(
      profilesRef,
      where("isPublic", "==", true),
      where("searchKeywords", "array-contains-any", searchKeywords),
      orderBy("updatedAt", "desc"),
      limit(maxResults),
    )

    const querySnapshot = await getDocs(q)
    const profiles: UserProfile[] = []

    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...doc.data() } as UserProfile)
    })

    return profiles
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      console.warn("Firestore permission denied for search - check security rules")
      return []
    }
    console.error("Error searching profiles:", error)
    return []
  }
}

// Get all public profiles (for browsing)
export async function getPublicProfiles(maxResults = 20): Promise<UserProfile[]> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty public profiles")
    return []
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return []
  }

  try {
    const profilesRef = collection(db, "profiles")
    const q = query(profilesRef, where("isPublic", "==", true), orderBy("updatedAt", "desc"), limit(maxResults))

    const querySnapshot = await getDocs(q)
    const profiles: UserProfile[] = []

    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...doc.data() } as UserProfile)
    })

    return profiles
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      console.warn("Firestore permission denied for public profiles - check security rules")
      return []
    }
    console.error("Error getting public profiles:", error)
    return []
  }
}

// Generate search keywords from text
function generateSearchKeywords(profileName: string, profileDescription: string): string[] {
  const text = `${profileName} ${profileDescription}`.toLowerCase()
  const words = text.split(/\s+/).filter((word) => word.length > 2)

  // Remove duplicates and common words
  const commonWords = [
    "the",
    "and",
    "for",
    "are",
    "but",
    "not",
    "you",
    "all",
    "can",
    "had",
    "her",
    "was",
    "one",
    "our",
    "out",
    "day",
    "get",
    "has",
    "him",
    "his",
    "how",
    "man",
    "new",
    "now",
    "old",
    "see",
    "two",
    "way",
    "who",
    "boy",
    "did",
    "its",
    "let",
    "put",
    "say",
    "she",
    "too",
    "use",
  ]

  return [...new Set(words.filter((word) => !commonWords.includes(word)))]
}

// Delete user profile
export async function deleteUserProfile(userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, skipping profile deletion")
    return
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return
  }

  if (!userId) {
    console.warn("No user ID provided")
    return
  }

  try {
    const profileRef = doc(db, "profiles", userId)
    await updateDoc(profileRef, {
      isPublic: false,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      console.warn("Firestore permission denied for profile deletion - check security rules")
      return
    }
    console.error("Error deleting profile:", error)
    throw error
  }
}
