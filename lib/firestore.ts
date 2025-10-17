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
  profileInfoColor?: string
  profileInfoTrimColor?: string
  textColor?: string // Added textColor field
  theme: "light-business" | "dark-business" | "business-casual"
  showcaseItems: ShowcaseItem[]
  resumeFile: string
  isPublic: boolean
  connections?: Connection[]
  sentConnectionRequests?: ConnectionRequest[] // Requests sent by this user
  receivedConnectionRequests?: ConnectionRequest[] // Requests received by this user
  createdAt: Timestamp
  updatedAt: Timestamp
  searchKeywords: string[]
}

export interface ShowcaseItem {
  id: string
  type: "image" | "video" | "text"
  content: string
  title: string
  description: string
}

export interface Connection {
  id: string
  userId: string
  profileName: string
  profilePicture: string
  email: string
  connectedAt: number
}

export interface ConnectionRequest {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserPicture: string
  fromUserEmail: string
  toUserId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: number
  respondedAt?: number
}

// Create or update user profile
export async function saveUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping profile save")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  if (!userId) {
    console.warn("[v0] No user ID provided")
    return
  }

  try {
    console.log("[v0] Saving profile for user:", userId)
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
      console.log("[v0] Updating existing profile")
      await updateDoc(profileRef, dataToSave)
    } else {
      // Create new profile
      console.log("[v0] Creating new profile")
      await setDoc(profileRef, {
        ...dataToSave,
        createdAt: serverTimestamp(),
      })
    }
    console.log("[v0] Profile save completed successfully")
  } catch (error: any) {
    console.error("[v0] Error saving profile:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules and authentication")
      console.error("[v0] Make sure your Firestore rules allow authenticated users to write to profiles collection")
    }
    throw error
  }
}

// Get user profile by userId
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, returning null profile")
    return null
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return null
  }

  if (!userId) {
    console.warn("[v0] No user ID provided")
    return null
  }

  try {
    console.log("[v0] Fetching profile for user:", userId)
    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (profileSnap.exists()) {
      console.log("[v0] Profile found in database")
      return { id: profileSnap.id, ...profileSnap.data() } as UserProfile
    }

    console.log("[v0] No profile found in database")
    return null
  } catch (error: any) {
    console.error("[v0] Error getting profile:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules and authentication")
    }
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
    console.log("[v0] Searching for profiles with term:", searchTerm)

    // First, try to search by profile name directly
    const profilesRef = collection(db, "profiles")
    const searchLower = searchTerm.toLowerCase()

    // Get all public profiles and filter client-side for better profile name matching
    const q = query(
      profilesRef,
      where("isPublic", "==", true),
      limit(50), // Get more results to filter client-side
    )

    const querySnapshot = await getDocs(q)
    const profiles: UserProfile[] = []

    querySnapshot.forEach((doc) => {
      const profile = { id: doc.id, ...doc.data() } as UserProfile
      const profileNameLower = profile.profileName.toLowerCase()

      // Prioritize exact matches and profile name matches
      if (profileNameLower.includes(searchLower)) {
        profiles.push(profile)
      }
    })

    // Sort by relevance: exact matches first, then partial matches
    profiles.sort((a, b) => {
      const aName = a.profileName.toLowerCase()
      const bName = b.profileName.toLowerCase()
      const aExact = aName === searchLower
      const bExact = bName === searchLower
      const aStarts = aName.startsWith(searchLower)
      const bStarts = bName.startsWith(searchLower)

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      // Sort by update time for same relevance
      const aTime = a.updatedAt?.toMillis?.() || 0
      const bTime = b.updatedAt?.toMillis?.() || 0
      return bTime - aTime
    })

    console.log("[v0] Found", profiles.length, "matching profiles")
    return profiles.slice(0, maxResults)
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

  // Split by spaces and special characters
  const words = text.split(/[\s,.\-_!?;:()]+/).filter((word) => word.length > 2)

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
    "with",
    "this",
    "that",
    "from",
    "have",
    "been",
    "will",
    "your",
    "what",
    "when",
    "make",
    "like",
    "time",
    "just",
    "know",
    "take",
    "into",
    "year",
    "good",
    "some",
    "could",
    "them",
    "than",
    "then",
    "look",
    "only",
    "come",
    "over",
    "think",
    "also",
    "back",
    "after",
    "work",
    "first",
    "well",
    "even",
    "want",
    "because",
  ]

  const filteredWords = words.filter((word) => !commonWords.includes(word))

  // Add partial matches for better search (first 3+ characters)
  const partialMatches: string[] = []
  filteredWords.forEach((word) => {
    if (word.length >= 4) {
      partialMatches.push(word.substring(0, 3))
      partialMatches.push(word.substring(0, 4))
    }
  })

  return [...new Set([...filteredWords, ...partialMatches])]
}

// Delete user profile
export async function deleteUserProfile(userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping profile deletion")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  if (!userId) {
    console.warn("[v0] No user ID provided")
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
    console.error("[v0] Error deleting profile:", error)
    throw error
  }
}

// Admin function to delete any user's profile
export async function adminDeleteProfile(adminEmail: string, targetUserId: string): Promise<void> {
  if (adminEmail !== "e.santiago.e1@gmail.com" && adminEmail !== "gabeasosa@gmail.com") {
    throw new Error("Unauthorized: Admin access required")
  }

  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping profile deletion")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  try {
    console.log("[v0] Admin deleting profile:", targetUserId)
    const profileRef = doc(db, "profiles", targetUserId)
    await updateDoc(profileRef, {
      isPublic: false,
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] Profile deleted successfully by admin")
  } catch (error: any) {
    console.error("[v0] Error deleting profile:", error)
    throw error
  }
}

// Admin function to delete any user's showcase item
export async function adminDeleteShowcaseItem(adminEmail: string, targetUserId: string, itemId: string): Promise<void> {
  if (adminEmail !== "e.santiago.e1@gmail.com" && adminEmail !== "gabeasosa@gmail.com") {
    throw new Error("Unauthorized: Admin access required")
  }

  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping item deletion")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  try {
    console.log("[v0] Admin deleting showcase item:", itemId, "from user:", targetUserId)
    const profileRef = doc(db, "profiles", targetUserId)
    const profileSnap = await getDoc(profileRef)

    if (!profileSnap.exists()) {
      console.warn("[v0] Profile not found")
      return
    }

    const profile = profileSnap.data() as UserProfile
    const updatedItems = profile.showcaseItems.filter((item) => item.id !== itemId)

    await updateDoc(profileRef, {
      showcaseItems: updatedItems,
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] Showcase item deleted successfully by admin")
  } catch (error: any) {
    console.error("[v0] Error deleting showcase item:", error)
    throw error
  }
}

export async function sendConnectionRequest(
  currentUserId: string,
  currentUserProfile: UserProfile,
  targetUserId: string,
): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping connection request")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  if (!currentUserId || !targetUserId) {
    console.warn("[v0] Missing user IDs")
    return
  }

  if (currentUserId === targetUserId) {
    console.warn("[v0] Cannot send connection request to yourself")
    return
  }

  try {
    console.log("[v0] Sending connection request to:", targetUserId)

    // Get target user's profile
    const targetProfileRef = doc(db, "profiles", targetUserId)
    const targetProfileSnap = await getDoc(targetProfileRef)

    if (!targetProfileSnap.exists()) {
      console.warn("[v0] Target user profile not found")
      return
    }

    const targetProfile = targetProfileSnap.data() as UserProfile

    // Create the connection request
    const requestId = `${currentUserId}_${targetUserId}_${Date.now()}`
    const newRequest: ConnectionRequest = {
      id: requestId,
      fromUserId: currentUserId,
      fromUserName: currentUserProfile.profileName,
      fromUserPicture: currentUserProfile.profilePicture,
      fromUserEmail: currentUserProfile.email,
      toUserId: targetUserId,
      status: "pending",
      createdAt: Date.now(),
    }

    // Add to sender's sentConnectionRequests
    const currentProfileRef = doc(db, "profiles", currentUserId)
    const currentSentRequests = currentUserProfile.sentConnectionRequests || []

    // Check if request already exists
    const existingRequest = currentSentRequests.find((req) => req.toUserId === targetUserId && req.status === "pending")

    if (existingRequest) {
      console.log("[v0] Connection request already sent")
      return
    }

    await updateDoc(currentProfileRef, {
      sentConnectionRequests: [...currentSentRequests, newRequest],
      updatedAt: serverTimestamp(),
    })

    // Add to recipient's receivedConnectionRequests
    const targetReceivedRequests = targetProfile.receivedConnectionRequests || []
    await updateDoc(targetProfileRef, {
      receivedConnectionRequests: [...targetReceivedRequests, newRequest],
      updatedAt: serverTimestamp(),
    })

    console.log("[v0] Connection request sent successfully")
  } catch (error: any) {
    console.error("[v0] Error sending connection request:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules")
    }
    throw error
  }
}

export async function getPendingConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured")
    return []
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return []
  }

  try {
    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (!profileSnap.exists()) {
      return []
    }

    const profile = profileSnap.data() as UserProfile
    const receivedRequests = profile.receivedConnectionRequests || []

    // Filter for pending requests only
    return receivedRequests.filter((req) => req.status === "pending")
  } catch (error: any) {
    console.error("[v0] Error fetching connection requests:", error)
    return []
  }
}

export async function hasPendingRequest(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) {
    return false
  }

  try {
    const profileRef = doc(db, "profiles", currentUserId)
    const profileSnap = await getDoc(profileRef)

    if (!profileSnap.exists()) {
      return false
    }

    const profile = profileSnap.data() as UserProfile
    const sentRequests = profile.sentConnectionRequests || []

    return sentRequests.some((req) => req.toUserId === targetUserId && req.status === "pending")
  } catch (error: any) {
    console.error("[v0] Error checking pending request:", error)
    return false
  }
}

export async function respondToConnectionRequest(
  currentUserId: string,
  requestId: string,
  accept: boolean,
  requesterProfile: UserProfile,
): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping connection response")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  try {
    console.log("[v0] Responding to connection request:", requestId, accept ? "accept" : "reject")

    // Get current user's profile
    const currentProfileRef = doc(db, "profiles", currentUserId)
    const currentProfileSnap = await getDoc(currentProfileRef)

    if (!currentProfileSnap.exists()) {
      console.warn("[v0] Current user profile not found")
      return
    }

    const currentProfile = currentProfileSnap.data() as UserProfile
    const receivedRequests = currentProfile.receivedConnectionRequests || []

    // Find the request
    const request = receivedRequests.find((req) => req.id === requestId)

    if (!request) {
      console.warn("[v0] Connection request not found")
      return
    }

    if (accept) {
      // Add connection to both users
      const existingConnections = currentProfile.connections || []
      const newConnection: Connection = {
        id: request.fromUserId,
        userId: request.fromUserId,
        profileName: request.fromUserName,
        profilePicture: request.fromUserPicture,
        email: request.fromUserEmail,
        connectedAt: Date.now(),
      }

      // Update current user's profile - add connection and remove request
      const updatedReceivedRequests = receivedRequests.filter((req) => req.id !== requestId)
      await updateDoc(currentProfileRef, {
        connections: [...existingConnections, newConnection],
        receivedConnectionRequests: updatedReceivedRequests,
        updatedAt: serverTimestamp(),
      })

      // Add connection to requester's profile and update their sent requests
      const requesterProfileRef = doc(db, "profiles", request.fromUserId)
      const requesterProfileSnap = await getDoc(requesterProfileRef)

      if (requesterProfileSnap.exists()) {
        const requesterData = requesterProfileSnap.data() as UserProfile
        const requesterConnections = requesterData.connections || []
        const requesterSentRequests = requesterData.sentConnectionRequests || []

        const reciprocalConnection: Connection = {
          id: currentUserId,
          userId: currentUserId,
          profileName: currentProfile.profileName,
          profilePicture: currentProfile.profilePicture,
          email: currentProfile.email,
          connectedAt: Date.now(),
        }

        const updatedSentRequests = requesterSentRequests.filter((req) => req.id !== requestId)

        await updateDoc(requesterProfileRef, {
          connections: [...requesterConnections, reciprocalConnection],
          sentConnectionRequests: updatedSentRequests,
          updatedAt: serverTimestamp(),
        })
      }
    } else {
      // Reject - just remove the request from both users
      const updatedReceivedRequests = receivedRequests.filter((req) => req.id !== requestId)
      await updateDoc(currentProfileRef, {
        receivedConnectionRequests: updatedReceivedRequests,
        updatedAt: serverTimestamp(),
      })

      // Remove from requester's sent requests
      const requesterProfileRef = doc(db, "profiles", request.fromUserId)
      const requesterProfileSnap = await getDoc(requesterProfileRef)

      if (requesterProfileSnap.exists()) {
        const requesterData = requesterProfileSnap.data() as UserProfile
        const requesterSentRequests = requesterData.sentConnectionRequests || []
        const updatedSentRequests = requesterSentRequests.filter((req) => req.id !== requestId)

        await updateDoc(requesterProfileRef, {
          sentConnectionRequests: updatedSentRequests,
          updatedAt: serverTimestamp(),
        })
      }
    }

    console.log("[v0] Connection request responded successfully")
  } catch (error: any) {
    console.error("[v0] Error responding to connection request:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules")
    }
    throw error
  }
}

export async function cancelConnectionRequest(currentUserId: string, targetUserId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping request cancellation")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  try {
    console.log("[v0] Canceling connection request to:", targetUserId)

    // Get current user's profile
    const currentProfileRef = doc(db, "profiles", currentUserId)
    const currentProfileSnap = await getDoc(currentProfileRef)

    if (!currentProfileSnap.exists()) {
      console.warn("[v0] Current user profile not found")
      return
    }

    const currentProfile = currentProfileSnap.data() as UserProfile
    const sentRequests = currentProfile.sentConnectionRequests || []

    // Find the request to cancel
    const requestToCancel = sentRequests.find((req) => req.toUserId === targetUserId && req.status === "pending")

    if (!requestToCancel) {
      console.warn("[v0] No pending request found to cancel")
      return
    }

    // Remove from sender's sent requests
    const updatedSentRequests = sentRequests.filter((req) => req.id !== requestToCancel.id)
    await updateDoc(currentProfileRef, {
      sentConnectionRequests: updatedSentRequests,
      updatedAt: serverTimestamp(),
    })

    // Remove from recipient's received requests
    const targetProfileRef = doc(db, "profiles", targetUserId)
    const targetProfileSnap = await getDoc(targetProfileRef)

    if (targetProfileSnap.exists()) {
      const targetProfile = targetProfileSnap.data() as UserProfile
      const receivedRequests = targetProfile.receivedConnectionRequests || []
      const updatedReceivedRequests = receivedRequests.filter((req) => req.id !== requestToCancel.id)

      await updateDoc(targetProfileRef, {
        receivedConnectionRequests: updatedReceivedRequests,
        updatedAt: serverTimestamp(),
      })
    }

    console.log("[v0] Connection request canceled successfully")
  } catch (error: any) {
    console.error("[v0] Error canceling connection request:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules")
    }
    throw error
  }
}

// Remove user connection
export async function removeConnection(currentUserId: string, targetUserId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping connection removal")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  if (!currentUserId || !targetUserId) {
    console.warn("[v0] Missing user IDs")
    return
  }

  try {
    console.log("[v0] Removing connection:", targetUserId)

    // Only remove from current user's connections (unilateral disconnect)
    // Each user manages their own connections to avoid permission issues
    const currentProfileRef = doc(db, "profiles", currentUserId)
    const currentProfileSnap = await getDoc(currentProfileRef)

    if (!currentProfileSnap.exists()) {
      console.warn("[v0] Current user profile not found")
      return
    }

    const currentProfile = currentProfileSnap.data() as UserProfile
    const currentConnections = currentProfile.connections || []
    const updatedCurrentConnections = currentConnections.filter((conn) => conn.userId !== targetUserId)

    await updateDoc(currentProfileRef, {
      connections: updatedCurrentConnections,
      updatedAt: serverTimestamp(),
    })

    console.log("[v0] Connection removed successfully from your profile")
  } catch (error: any) {
    console.error("[v0] Error removing connection:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules")
    }
    throw error
  }
}
