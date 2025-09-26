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
import { auth } from "./firebase"

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

export async function saveUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    console.log("[v0] Firebase not configured, skipping profile save")
    return
  }

  // Check if user is authenticated
  if (!auth?.currentUser) {
    console.log("[v0] No authenticated user for save operation, waiting...")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (!auth?.currentUser) {
      console.log("[v0] Still no authenticated user for save operation")
      throw new Error("FIREBASE_PERMISSIONS_ERROR")
    }
  }

  console.log("[v0] Authenticated user for save:", auth.currentUser.uid)
  console.log("[v0] Saving profile for:", userId)

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
      console.log("[v0] Profile updated successfully")
    } else {
      // Create new profile
      await setDoc(profileRef, {
        ...dataToSave,
        createdAt: serverTimestamp(),
      })
      console.log("[v0] New profile created successfully")
    }
  } catch (error: any) {
    console.log("[v0] Save error details:", {
      code: error?.code,
      message: error?.message,
      authUser: auth?.currentUser?.uid,
      targetUserId: userId,
    })

    if (error?.message?.includes("client is offline") || error?.code === "unavailable") {
      console.log("[v0] Firebase is offline, profile changes saved locally only")
      return
    }

    if (error?.message?.includes("Missing or insufficient permissions") || error?.code === "permission-denied") {
      console.log("[v0] Firebase permissions error - database may need security rules configured")
      throw new Error("FIREBASE_PERMISSIONS_ERROR")
    }

    console.error("Error saving profile:", error)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !db) {
    console.log("[v0] Firebase not configured, returning null profile")
    return null
  }

  // Check if user is authenticated
  if (!auth?.currentUser) {
    console.log("[v0] No authenticated user, waiting for auth state...")
    // Wait a bit for auth state to settle
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (!auth?.currentUser) {
      console.log("[v0] Still no authenticated user after waiting")
      throw new Error("FIREBASE_PERMISSIONS_ERROR")
    }
  }

  console.log("[v0] Authenticated user:", auth.currentUser.uid)
  console.log("[v0] Requesting profile for:", userId)

  try {
    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (profileSnap.exists()) {
      console.log("[v0] Profile loaded successfully from Firestore")
      return { id: profileSnap.id, ...profileSnap.data() } as UserProfile
    }

    console.log("[v0] No profile found in Firestore")
    return null
  } catch (error: any) {
    console.log("[v0] Firestore error details:", {
      code: error?.code,
      message: error?.message,
      authUser: auth?.currentUser?.uid,
      requestedUserId: userId,
    })

    if (error?.message?.includes("client is offline") || error?.code === "unavailable") {
      console.log("[v0] Firebase is offline, falling back to local profile")
      return null
    }

    if (error?.message?.includes("Missing or insufficient permissions") || error?.code === "permission-denied") {
      console.log("[v0] Firebase permissions error - database may need security rules configured")
      throw new Error("FIREBASE_PERMISSIONS_ERROR")
    }

    console.error("Error getting profile:", error)
    throw error
  }
}

// Search profiles by keywords
export async function searchProfiles(searchTerm: string, maxResults = 10): Promise<UserProfile[]> {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase not configured, returning empty search results")
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
  } catch (error) {
    console.error("Error searching profiles:", error)
    throw error
  }
}

// Get all public profiles (for browsing)
export async function getPublicProfiles(maxResults = 20): Promise<UserProfile[]> {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase not configured, returning empty public profiles")
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
  } catch (error) {
    console.error("Error getting public profiles:", error)
    throw error
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
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase not configured, skipping profile deletion")
    return
  }

  try {
    const profileRef = doc(db, "profiles", userId)
    await updateDoc(profileRef, {
      isPublic: false,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error deleting profile:", error)
    throw error
  }
}
