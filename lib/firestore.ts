import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc, // Added deleteDoc import for modular SDK
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
  // Import limit from firebase/firestore for clarity, though often it's implicitly imported with other functions
  limit as firebaseLimit,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"

// Define Post and Comment interfaces here
export interface Post {
  id: string
  userId: string
  userName: string
  userPicture: string
  content: string
  imageUrl?: string
  likes: string[]
  likeCount: number
  commentCount: number
  viewCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userPicture: string
  content: string
  parentCommentId?: string
  createdAt: Timestamp
}

export interface Notification {
  id: string
  type: "post_like" | "comment_reply" | "new_connection" | "connection_request_accepted"
  fromUserId: string
  fromUserName: string
  fromUserPicture: string
  toUserId: string
  postId?: string
  commentId?: string
  commentContent?: string
  read: boolean
  createdAt: number
}

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
  verificationBadges?: VerificationBadge[]
  createdAt: Timestamp
  updatedAt: Timestamp
  searchKeywords: string[]
}

export interface VerificationBadge {
  type: "student" | "portfolio" | "certification"
  verified: boolean
  verifiedAt?: Timestamp
  expiresAt?: Timestamp
  metadata?: {
    schoolEmail?: string
    schoolName?: string
    certificationName?: string
    certificationFile?: string
    certificationIssuer?: string
    certificationDate?: string
  }
}

export interface ShowcaseItem {
  id: string
  type: "image" | "video" | "text"
  content: string
  title: string
  description: string
  imageUrl?: string // Added imageUrl to ShowcaseItem for trending profiles
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

export interface Notification {
  id: string
  type: "comment_reply" | "connection_request" | "post_like" // Added post_like type
  fromUserId: string
  fromUserName: string
  fromUserPicture: string
  toUserId: string
  postId?: string // For comment replies and post likes
  commentId?: string // For comment replies
  commentContent?: string // Preview of the reply
  read: boolean
  createdAt: number
}

export interface Post {
  id: string
  userId: string
  userName: string
  userPicture: string
  content: string
  imageUrl?: string
  hashtags: string[] // Array of hashtags without the # symbol
  likes: string[] // Array of user IDs who liked
  likeCount: number
  commentCount: number
  viewCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userPicture: string
  content: string
  parentCommentId?: string // Added parentCommentId field
  createdAt: Timestamp
}

export interface PostWithComments extends Post {
  comments: Comment[]
}

export interface ProfileCard {
  id: string
  userId: string
  profileName: string
  profileDescription: string
  profilePicture: string
  layout: "default" | "minimal" | "grid" | "masonry" | "spotlight"
  backgroundColor: string
  backgroundImage: string
  email: string
  isPublic: boolean
  showcaseItemCount: number
  previewImages: string[] // First 4 showcase images
  updatedAt: Timestamp
}

export async function checkAndUpdatePortfolioVerification(userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  try {
    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (!profileSnap.exists()) {
      return
    }

    const profile = profileSnap.data() as UserProfile
    const hasResume = !!profile.resumeFile
    const hasShowcaseItems = (profile.showcaseItems?.length || 0) >= 3

    const currentBadges = profile.verificationBadges || []
    const portfolioBadgeIndex = currentBadges.findIndex((b) => b.type === "portfolio")

    if (hasResume && hasShowcaseItems) {
      // Should have portfolio badge
      if (portfolioBadgeIndex === -1) {
        // Add portfolio badge
        const newBadge: VerificationBadge = {
          type: "portfolio",
          verified: true,
          verifiedAt: serverTimestamp() as Timestamp,
        }
        await updateDoc(profileRef, {
          verificationBadges: [...currentBadges, newBadge],
        })
        console.log("[v0] Portfolio verification badge added automatically")
      }
    } else {
      // Should not have portfolio badge
      if (portfolioBadgeIndex !== -1) {
        // Remove portfolio badge
        const updatedBadges = currentBadges.filter((b) => b.type !== "portfolio")
        await updateDoc(profileRef, {
          verificationBadges: updatedBadges,
        })
        console.log("[v0] Portfolio verification badge removed (requirements not met)")
      }
    }
  } catch (error) {
    console.error("[v0] Error checking portfolio verification:", error)
  }
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

    // Check and update portfolio verification automatically
    await checkAndUpdatePortfolioVerification(userId)

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
export async function searchProfiles(searchTerm: string, maxResults = 10, isAdmin = false): Promise<UserProfile[]> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty search results")
    return []
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return []
  }

  try {
    console.log("[v0] Searching for profiles with term:", searchTerm, "Admin:", isAdmin)

    const profilesRef = collection(db, "profiles")
    const searchLower = searchTerm.toLowerCase().trim()

    const q = isAdmin ? query(profilesRef, limit(50)) : query(profilesRef, where("isPublic", "==", true), limit(50))

    const querySnapshot = await getDocs(q)
    const profiles: UserProfile[] = []

    querySnapshot.forEach((doc) => {
      const profile = { id: doc.id, ...doc.data() } as UserProfile
      const profileNameLower = profile.profileName.toLowerCase()
      const profileDescLower = profile.profileDescription.toLowerCase()
      const searchKeywords = profile.searchKeywords || []

      // Check if search term matches name, description, or keywords
      const matchesName = profileNameLower.includes(searchLower)
      const matchesDescription = profileDescLower.includes(searchLower)
      const matchesKeywords = searchKeywords.some((keyword) => keyword.includes(searchLower))

      if (matchesName || matchesDescription || matchesKeywords) {
        profiles.push(profile)
      }
    })

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
export async function getPublicProfiles(maxResults = 20, isAdmin = false): Promise<UserProfile[]> {
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

    const q = isAdmin
      ? query(profilesRef, orderBy("updatedAt", "desc"), limit(maxResults))
      : query(profilesRef, where("isPublic", "==", true), orderBy("updatedAt", "desc"), limit(maxResults))

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

export async function getPublicProfileCards(
  maxResults = 20,
  isAdmin = false,
  startAfter?: any,
): Promise<{
  profiles: ProfileCard[]
  lastDoc: any
  hasMore: boolean
}> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty public profiles")
    return { profiles: [], lastDoc: null, hasMore: false }
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return { profiles: [], lastDoc: null, hasMore: false }
  }

  try {
    const profilesRef = collection(db, "profiles")

    let q
    if (startAfter) {
      q = isAdmin
        ? query(profilesRef, orderBy("updatedAt", "desc"), limit(maxResults + 1), startAfter)
        : query(
            profilesRef,
            where("isPublic", "==", true),
            orderBy("updatedAt", "desc"),
            limit(maxResults + 1),
            startAfter,
          )
    } else {
      q = isAdmin
        ? query(profilesRef, orderBy("updatedAt", "desc"), limit(maxResults + 1))
        : query(profilesRef, where("isPublic", "==", true), orderBy("updatedAt", "desc"), limit(maxResults + 1))
    }

    const querySnapshot = await getDocs(q)
    const profiles: ProfileCard[] = []

    // Check if there are more results
    const hasMore = querySnapshot.docs.length > maxResults
    const docsToProcess = hasMore ? querySnapshot.docs.slice(0, maxResults) : querySnapshot.docs

    docsToProcess.forEach((doc) => {
      const data = doc.data() as UserProfile

      // Extract only first 4 image URLs from showcaseItems
      const previewImages = data.showcaseItems
        .filter((item) => item.type === "image" && item.content)
        .slice(0, 4)
        .map((item) => item.content)

      profiles.push({
        id: doc.id,
        userId: data.userId,
        profileName: data.profileName,
        profileDescription: data.profileDescription,
        profilePicture: data.profilePicture,
        layout: data.layout,
        backgroundColor: data.backgroundColor,
        backgroundImage: data.backgroundImage,
        email: data.email,
        isPublic: data.isPublic,
        showcaseItemCount: data.showcaseItems.length,
        previewImages,
        updatedAt: data.updatedAt,
      })
    })

    const lastDoc = hasMore ? querySnapshot.docs[maxResults - 1] : null

    return { profiles, lastDoc, hasMore }
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      console.warn("Firestore permission denied for public profiles - check security rules")
      return { profiles: [], lastDoc: null, hasMore: false }
    }
    console.error("Error getting public profiles:", error)
    return { profiles: [], lastDoc: null, hasMore: false }
  }
}

export async function searchProfileCards(searchTerm: string, maxResults = 10, isAdmin = false): Promise<ProfileCard[]> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty search results")
    return []
  }

  if (!db) {
    console.warn("Firestore database not initialized")
    return []
  }

  try {
    console.log("[v0] Searching for profiles with term:", searchTerm, "Admin:", isAdmin)

    const profilesRef = collection(db, "profiles")
    const searchLower = searchTerm.toLowerCase().trim()

    // Fetch fewer profiles for search (30 instead of 50)
    const q = isAdmin ? query(profilesRef, limit(30)) : query(profilesRef, where("isPublic", "==", true), limit(30))

    const querySnapshot = await getDocs(q)
    const profiles: ProfileCard[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserProfile
      const profileNameLower = data.profileName.toLowerCase()
      const profileDescLower = data.profileDescription.toLowerCase()
      const searchKeywords = data.searchKeywords || []

      // Check if search term matches:
      // 1. Profile name
      // 2. Profile description
      // 3. Any of the generated keywords
      const matchesName = profileNameLower.includes(searchLower)
      const matchesDescription = profileDescLower.includes(searchLower)
      const matchesKeywords = searchKeywords.some((keyword) => keyword.includes(searchLower))

      console.log(
        "[v0] Profile:",
        data.profileName,
        "- Name match:",
        matchesName,
        "Desc match:",
        matchesDescription,
        "Keyword match:",
        matchesKeywords,
      )

      if (matchesName || matchesDescription || matchesKeywords) {
        const previewImages = data.showcaseItems
          .filter((item) => item.type === "image" && item.content)
          .slice(0, 4)
          .map((item) => item.content)

        profiles.push({
          id: doc.id,
          userId: data.userId,
          profileName: data.profileName,
          profileDescription: data.profileDescription,
          profilePicture: data.profilePicture,
          layout: data.layout,
          backgroundColor: data.backgroundColor,
          backgroundImage: data.backgroundImage,
          email: data.email,
          isPublic: data.isPublic,
          showcaseItemCount: data.showcaseItems.length,
          previewImages,
          updatedAt: data.updatedAt,
        })
      }
    })

    // Sort by relevance
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
    if (error?.code === "permission-denied") {
      throw new Error(
        "Admin permissions not configured in Firestore. Please update your Firestore security rules to enable admin functionality. See CONNECTION_SETUP.md for instructions.",
      )
    }
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
    if (error?.code === "permission-denied") {
      throw new Error(
        "Admin permissions not configured in Firestore. Please update your Firestore security rules to enable admin functionality. See CONNECTION_SETUP.md for instructions.",
      )
    }
    throw error
  }
}

// Admin function to reset a user's connections
export async function adminResetConnections(adminEmail: string, targetUserId: string): Promise<void> {
  if (adminEmail !== "e.santiago.e1@gmail.com" && adminEmail !== "gabeasosa@gmail.com") {
    throw new Error("Unauthorized: Admin access required")
  }

  if (!isFirebaseConfigured()) {
    console.warn("[v0] Firebase not configured, skipping connection reset")
    return
  }

  if (!db) {
    console.warn("[v0] Firestore database not initialized")
    return
  }

  try {
    console.log("[v0] Admin resetting connections for user:", targetUserId)
    const profileRef = doc(db, "profiles", targetUserId)
    await updateDoc(profileRef, {
      connections: [],
      sentConnectionRequests: [],
      receivedConnectionRequests: [],
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] Connections reset successfully by admin")
  } catch (error: any) {
    console.error("[v0] Error resetting connections:", error)
    if (error?.code === "permission-denied") {
      throw new Error(
        "Admin permissions not configured in Firestore. Please update your Firestore security rules to enable admin functionality. See CONNECTION_SETUP.md for instructions.",
      )
    }
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

    console.log("[v0] Connection request added to your sent requests")

    try {
      const targetReceivedRequests = targetProfile.receivedConnectionRequests || []
      await updateDoc(targetProfileRef, {
        receivedConnectionRequests: [...targetReceivedRequests, newRequest],
        updatedAt: serverTimestamp(),
      })

      console.log("[v0] Connection request sent successfully")
    } catch (recipientError: any) {
      if (recipientError?.code === "permission-denied") {
        console.warn("[v0] Could not add request to recipient's profile due to permissions")
        console.warn("[v0] Request saved on your side. Recipient won't see it until security rules are updated.")
        console.warn(
          "[v0] To enable full connection request functionality, update Firestore security rules (see FIREBASE_CONNECTION_FIX.md)",
        )
        // Don't throw - the request was saved on sender's side
      } else {
        console.error("[v0] Error updating recipient profile:", recipientError)
        throw recipientError
      }
    }
  } catch (error: any) {
    console.error("[v0] Error sending connection request:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules")
      throw new Error(
        "Connection request failed due to Firestore permissions. Please update your Firestore security rules as described in FIREBASE_CONNECTION_FIX.md",
      )
    }
    throw error
  }
}

export async function getConnectionRequestCount(userId: string): Promise<number> {
  if (!isFirebaseConfigured() || !db) {
    return 0
  }

  try {
    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (!profileSnap.exists()) {
      return 0
    }

    const profile = profileSnap.data() as UserProfile
    const receivedRequests = profile.receivedConnectionRequests || []

    // Count only pending requests
    return receivedRequests.filter((req) => req.status === "pending").length
  } catch (error: any) {
    console.error("[v0] Error fetching connection request count:", error)
    return 0
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
      const existingConnections = currentProfile.connections || []
      console.log("[v0] Current user existing connections count:", existingConnections.length)

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
      const acceptedRequest = { ...request, status: "accepted" as const, respondedAt: Date.now() }

      console.log("[v0] Updating current user profile - adding connection to:", request.fromUserName)

      await updateDoc(currentProfileRef, {
        connections: [...existingConnections, newConnection],
        receivedConnectionRequests: updatedReceivedRequests.map((req) =>
          req.id === requestId ? acceptedRequest : req,
        ),
        updatedAt: serverTimestamp(),
      })

      console.log("[v0] Current user profile updated - new connections count:", existingConnections.length + 1)

      try {
        const requesterProfileRef = doc(db, "profiles", request.fromUserId)
        const requesterProfileSnap = await getDoc(requesterProfileRef)

        if (requesterProfileSnap.exists()) {
          const requesterData = requesterProfileSnap.data() as UserProfile
          const requesterConnections = requesterData.connections || []
          const requesterSentRequests = requesterData.sentConnectionRequests || []

          console.log("[v0] Requester existing connections count:", requesterConnections.length)

          const reciprocalConnection: Connection = {
            id: currentUserId,
            userId: currentUserId,
            profileName: currentProfile.profileName,
            profilePicture: currentProfile.profilePicture,
            email: currentProfile.email,
            connectedAt: Date.now(),
          }

          const updatedSentRequests = requesterSentRequests.map((req) =>
            req.id === requestId ? { ...req, status: "accepted" as const, respondedAt: Date.now() } : req,
          )

          console.log("[v0] Updating requester profile - adding connection to:", currentProfile.profileName)

          await updateDoc(requesterProfileRef, {
            connections: [...requesterConnections, reciprocalConnection],
            sentConnectionRequests: updatedSentRequests,
            updatedAt: serverTimestamp(),
          })

          console.log("[v0] Requester profile updated successfully")
        }
      } catch (requesterError: any) {
        if (requesterError?.code === "permission-denied") {
          console.warn("[v0] Could not update requester's profile due to permissions")
          console.warn("[v0] Connection accepted on your side. The requester will see the connection when they sync.")
          console.warn(
            "[v0] To enable automatic two-way connections, update Firestore security rules (see FIREBASE_CONNECTION_FIX.md)",
          )
        } else {
          console.error("[v0] Error updating requester profile:", requesterError)
        }
      }
    } else {
      const updatedReceivedRequests = receivedRequests.filter((req) => req.id !== requestId)
      await updateDoc(currentProfileRef, {
        receivedConnectionRequests: updatedReceivedRequests,
        updatedAt: serverTimestamp(),
      })

      try {
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

          console.log("[v0] Request removed from requester's sent requests")
        }
      } catch (requesterError: any) {
        if (requesterError?.code === "permission-denied") {
          console.warn("[v0] Could not update requester's profile due to permissions")
        }
      }

      console.log("[v0] Connection request rejected")
    }

    console.log("[v0] Connection request responded successfully")
  } catch (error: any) {
    console.error("[v0] Error responding to connection request:", error)
    if (error?.code === "permission-denied") {
      console.error("[v0] Firestore permission denied - check security rules")
      console.error(
        "[v0] Make sure you've updated your Firestore security rules as described in FIREBASE_CONNECTION_FIX.md",
      )
    }
    throw error
  }
}

export async function syncAcceptedConnections(userId: string): Promise<number> {
  if (!isFirebaseConfigured() || !db) {
    return 0
  }

  try {
    console.log("[v0] Syncing accepted connections for user:", userId)

    const profileRef = doc(db, "profiles", userId)
    const profileSnap = await getDoc(profileRef)

    if (!profileSnap.exists()) {
      return 0
    }

    const profile = profileSnap.data() as UserProfile
    const sentRequests = profile.sentConnectionRequests || []
    const existingConnections = profile.connections || []
    const existingConnectionIds = new Set(existingConnections.map((c) => c.userId))

    const acceptedRequests = sentRequests.filter(
      (req) => req.status === "accepted" && !existingConnectionIds.has(req.toUserId),
    )

    if (acceptedRequests.length === 0) {
      console.log("[v0] No new accepted connections to sync")
      return 0
    }

    const newConnections: Connection[] = []
    for (const req of acceptedRequests) {
      try {
        const targetProfileRef = doc(db, "profiles", req.toUserId)
        const targetProfileSnap = await getDoc(targetProfileRef)

        if (targetProfileSnap.exists()) {
          const targetProfile = targetProfileSnap.data() as UserProfile
          newConnections.push({
            id: req.toUserId,
            userId: req.toUserId,
            profileName: targetProfile.profileName,
            profilePicture: targetProfile.profilePicture,
            email: targetProfile.email,
            connectedAt: req.respondedAt || Date.now(),
          })
        }
      } catch (error) {
        console.warn("[v0] Could not fetch profile for accepted connection:", req.toUserId)
      }
    }

    if (newConnections.length > 0) {
      const updatedSentRequests = sentRequests.filter((req) => req.status !== "accepted")

      await updateDoc(profileRef, {
        connections: [...existingConnections, ...newConnections],
        sentConnectionRequests: updatedSentRequests,
        updatedAt: serverTimestamp(),
      })

      console.log("[v0] Synced", newConnections.length, "accepted connections")
    }

    return newConnections.length
  } catch (error) {
    console.error("[v0] Error syncing accepted connections:", error)
    return 0
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

    const currentProfileRef = doc(db, "profiles", currentUserId)
    const currentProfileSnap = await getDoc(currentProfileRef)

    if (!currentProfileSnap.exists()) {
      console.warn("[v0] Current user profile not found")
      return
    }

    const currentProfile = currentProfileSnap.data() as UserProfile
    const sentRequests = currentProfile.sentConnectionRequests || []

    const requestToCancel = sentRequests.find((req) => req.toUserId === targetUserId && req.status === "pending")

    if (!requestToCancel) {
      console.warn("[v0] No pending request found to cancel")
      return
    }

    const updatedSentRequests = sentRequests.filter((req) => req.id !== requestToCancel.id)
    await updateDoc(currentProfileRef, {
      sentConnectionRequests: updatedSentRequests,
      updatedAt: serverTimestamp(),
    })

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

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex)
  if (!matches) return []

  // Remove # symbol and convert to lowercase for case-insensitive search
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))]
}

export async function createPost(
  userId: string,
  userName: string,
  userPicture: string,
  content: string,
  imageUrl?: string,
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  if (!content.trim()) {
    throw new Error("Post content cannot be empty")
  }

  try {
    console.log("[v0] Creating new post for user:", userId)
    const postsRef = collection(db, "posts")
    const newPostRef = doc(postsRef)

    const hashtags = extractHashtags(content)

    const newPost: Omit<Post, "id"> = {
      userId,
      userName,
      userPicture,
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      hashtags, // Store extracted hashtags
      likes: [],
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    await setDoc(newPostRef, newPost)
    console.log("[v0] Post created successfully:", newPostRef.id)
    return newPostRef.id
  } catch (error: any) {
    console.error("[v0] Error creating post:", error)
    throw error
  }
}

export async function getPosts(
  maxResults = 20,
  startAfter?: any,
): Promise<{
  posts: Post[]
  lastDoc: any
  hasMore: boolean
}> {
  if (!isFirebaseConfigured()) {
    return { posts: [], lastDoc: null, hasMore: false }
  }

  if (!db) {
    return { posts: [], lastDoc: null, hasMore: false }
  }

  try {
    const postsRef = collection(db, "posts")

    let q
    if (startAfter) {
      q = query(postsRef, orderBy("createdAt", "desc"), limit(maxResults + 1), startAfter)
    } else {
      q = query(postsRef, orderBy("createdAt", "desc"), limit(maxResults + 1))
    }

    const querySnapshot = await getDocs(q)
    const posts: Post[] = []

    const hasMore = querySnapshot.docs.length > maxResults
    const docsToProcess = hasMore ? querySnapshot.docs.slice(0, maxResults) : querySnapshot.docs

    docsToProcess.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post)
    })

    const lastDoc = hasMore ? querySnapshot.docs[maxResults - 1] : null

    return { posts, lastDoc, hasMore }
  } catch (error: any) {
    console.error("[v0] Error getting posts:", error)
    return { posts: [], lastDoc: null, hasMore: false }
  }
}

// Get posts by a specific user
export async function getPostsByUser(
  userId: string,
  maxResults = 20,
): Promise<{
  posts: Post[]
  lastDoc: any
  hasMore: boolean
}> {
  if (!isFirebaseConfigured()) {
    console.log("[v0] getPostsByUser: Firebase not configured")
    return { posts: [], lastDoc: null, hasMore: false }
  }

  if (!db) {
    console.log("[v0] getPostsByUser: Database not initialized")
    return { posts: [], lastDoc: null, hasMore: false }
  }

  try {
    console.log("[v0] getPostsByUser: Fetching posts for user:", userId)
    const postsRef = collection(db, "posts")
    const q = query(postsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(maxResults + 1))

    console.log("[v0] getPostsByUser: Executing query...")
    const querySnapshot = await getDocs(q)
    console.log("[v0] getPostsByUser: Query returned", querySnapshot.docs.length, "documents")

    const posts: Post[] = []

    const hasMore = querySnapshot.docs.length > maxResults
    const docsToProcess = hasMore ? querySnapshot.docs.slice(0, maxResults) : querySnapshot.docs

    docsToProcess.forEach((doc) => {
      const postData = { id: doc.id, ...doc.data() } as Post
      console.log("[v0] getPostsByUser: Post", doc.id, "userId:", postData.userId)
      posts.push(postData)
    })

    const lastDoc = hasMore ? querySnapshot.docs[maxResults - 1] : null

    console.log("[v0] getPostsByUser: Returning", posts.length, "posts")
    return { posts, lastDoc, hasMore }
  } catch (error: any) {
    console.error("[v0] getPostsByUser: Error getting user posts:", error)
    console.error("[v0] getPostsByUser: Error details:", error.message, error.code)
    return { posts: [], lastDoc: null, hasMore: false }
  }
}

export async function toggleLikePost(
  postId: string,
  userId: string,
  userName: string,
  userPicture: string,
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  try {
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (!postSnap.exists()) {
      throw new Error("Post not found")
    }

    const post = postSnap.data() as Post
    const likes = post.likes || []
    const isLiked = likes.includes(userId)

    if (isLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: likes.filter((id) => id !== userId),
        likeCount: Math.max(0, (post.likeCount || 0) - 1),
        updatedAt: serverTimestamp(),
      })
    } else {
      // Like
      await updateDoc(postRef, {
        likes: [...likes, userId],
        likeCount: (post.likeCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      if (post.userId !== userId) {
        try {
          await createNotification({
            type: "post_like",
            fromUserId: userId,
            fromUserName: userName,
            fromUserPicture: userPicture,
            toUserId: post.userId,
            postId,
            read: false,
            createdAt: Date.now(),
          })
        } catch (notificationError) {
          console.error("[v0] Error creating like notification:", notificationError)
          // Don't fail the like if notification fails
        }
      }
    }
  } catch (error: any) {
    console.error("[v0] Error toggling like:", error)
    throw error
  }
}

export async function addComment(
  postId: string,
  userId: string,
  userName: string,
  userPicture: string,
  content: string,
  parentCommentId?: string,
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  if (!content.trim()) {
    throw new Error("Comment content cannot be empty")
  }

  try {
    const commentsRef = collection(db, "posts", postId, "comments")
    const newCommentRef = doc(commentsRef)

    const newComment: Omit<Comment, "id"> = {
      postId,
      userId,
      userName,
      userPicture,
      content: content.trim(),
      ...(parentCommentId && { parentCommentId }),
      createdAt: serverTimestamp() as Timestamp,
    }

    await setDoc(newCommentRef, newComment)

    // Update comment count on post
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (postSnap.exists()) {
      const post = postSnap.data() as Post
      await updateDoc(postRef, {
        commentCount: (post.commentCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      if (parentCommentId) {
        try {
          const parentCommentRef = doc(db, "posts", postId, "comments", parentCommentId)
          const parentCommentSnap = await getDoc(parentCommentRef)

          if (parentCommentSnap.exists()) {
            const parentComment = parentCommentSnap.data() as Comment

            // Send notification to the person whose comment was replied to
            if (parentComment.userId !== userId) {
              await createNotification({
                type: "comment_reply",
                fromUserId: userId,
                fromUserName: userName,
                fromUserPicture: userPicture,
                toUserId: parentComment.userId,
                postId,
                commentId: newCommentRef.id,
                commentContent: content.trim().substring(0, 100),
                read: false,
                createdAt: Date.now(),
              })
            }

            // Also send notification to post creator if they're not the commenter or the parent comment author
            if (post.userId !== userId && post.userId !== parentComment.userId) {
              await createNotification({
                type: "comment_reply",
                fromUserId: userId,
                fromUserName: userName,
                fromUserPicture: userPicture,
                toUserId: post.userId,
                postId,
                commentId: newCommentRef.id,
                commentContent: content.trim().substring(0, 100),
                read: false,
                createdAt: Date.now(),
              })
            }
          }
        } catch (notificationError) {
          console.error("[v0] Error creating reply notification:", notificationError)
          // Don't fail the comment creation if notification fails
        }
      }
    }

    return newCommentRef.id
  } catch (error: any) {
    console.error("[v0] Error adding comment:", error)
    throw error
  }
}

export async function getComments(postId: string, maxResults = 50): Promise<Comment[]> {
  if (!isFirebaseConfigured()) {
    return []
  }

  if (!db) {
    return []
  }

  try {
    const commentsRef = collection(db, "posts", postId, "comments")
    const q = query(commentsRef, orderBy("createdAt", "asc"), limit(maxResults))

    const querySnapshot = await getDocs(q)
    const comments: Comment[] = []

    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() } as Comment)
    })

    return comments
  } catch (error: any) {
    console.error("[v0] Error getting comments:", error)
    return []
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  if (!isFirebaseConfigured()) {
    return null
  }

  if (!db) {
    return null
  }

  try {
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() } as Post
    }

    return null
  } catch (error: any) {
    console.error("[v0] Error getting post:", error)
    return null
  }
}

export async function incrementPostView(postId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return
  }

  if (!db) {
    return
  }

  try {
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (postSnap.exists()) {
      const post = postSnap.data() as Post
      await updateDoc(postRef, {
        viewCount: (post.viewCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error: any) {
    console.error("[v0] Error incrementing view count:", error)
  }
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  try {
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (!postSnap.exists()) {
      throw new Error("Post not found")
    }

    const post = postSnap.data() as Post

    // Check if user owns the post
    if (post.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own posts")
    }

    // Delete all comments first
    const commentsRef = collection(db, "posts", postId, "comments")
    const commentsSnapshot = await getDocs(commentsRef)

    const deletePromises = commentsSnapshot.docs.map((commentDoc) => deleteDoc(commentDoc.ref))
    await Promise.all(deletePromises)

    await deleteDoc(postRef)
    console.log("[v0] Post deleted successfully:", postId)
  } catch (error: any) {
    console.error("[v0] Error deleting post:", error)
    throw error
  }
}

// Admin function to delete any post
export async function adminDeletePost(adminEmail: string, postId: string): Promise<void> {
  if (adminEmail !== "e.santiago.e1@gmail.com" && adminEmail !== "gabeasosa@gmail.com") {
    throw new Error("Unauthorized: Admin access required")
  }

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  try {
    console.log("[v0] Admin deleting post:", postId)
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (!postSnap.exists()) {
      throw new Error("Post not found")
    }

    // Delete all comments first
    const commentsRef = collection(db, "posts", postId, "comments")
    const commentsSnapshot = await getDocs(commentsRef)

    const deletePromises = commentsSnapshot.docs.map((commentDoc) => deleteDoc(commentDoc.ref))
    await Promise.all(deletePromises)

    await deleteDoc(postRef)
    console.log("[v0] Post deleted successfully by admin:", postId)
  } catch (error: any) {
    console.error("[v0] Error deleting post:", error)
    if (error?.code === "permission-denied") {
      throw new Error(
        "Admin permissions not configured in Firestore. Please update your Firestore security rules to enable admin functionality.",
      )
    }
    throw error
  }
}

// Admin function to delete any comment
export async function adminDeleteComment(adminEmail: string, postId: string, commentId: string): Promise<void> {
  if (adminEmail !== "e.santiago.e1@gmail.com" && adminEmail !== "gabeasosa@gmail.com") {
    throw new Error("Unauthorized: Admin access required")
  }

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  try {
    console.log("[v0] Admin deleting comment:", commentId, "from post:", postId)
    const commentRef = doc(db, "posts", postId, "comments", commentId)
    const commentSnap = await getDoc(commentRef)

    if (!commentSnap.exists()) {
      throw new Error("Comment not found")
    }

    await deleteDoc(commentRef)

    // Update comment count on post
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (postSnap.exists()) {
      const post = postSnap.data() as Post
      await updateDoc(postRef, {
        commentCount: Math.max(0, (post.commentCount || 0) - 1),
        updatedAt: serverTimestamp(),
      })
    }

    console.log("[v0] Comment deleted successfully by admin:", commentId)
  } catch (error: any) {
    console.error("[v0] Error deleting comment:", error)
    if (error?.code === "permission-denied") {
      throw new Error(
        "Admin permissions not configured in Firestore. Please update your Firestore security rules to enable admin functionality.",
      )
    }
    throw error
  }
}

// Delete user's own comment
export async function deleteComment(postId: string, commentId: string, userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  try {
    const commentRef = doc(db, "posts", postId, "comments", commentId)
    const commentSnap = await getDoc(commentRef)

    if (!commentSnap.exists()) {
      throw new Error("Comment not found")
    }

    const comment = commentSnap.data() as Comment

    // Check if user owns the comment
    if (comment.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own comments")
    }

    await deleteDoc(commentRef)

    // Update comment count on post
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    if (postSnap.exists()) {
      const post = postSnap.data() as Post
      await updateDoc(postRef, {
        commentCount: Math.max(0, (post.commentCount || 0) - 1),
        updatedAt: serverTimestamp(),
      })
    }

    console.log("[v0] Comment deleted successfully:", commentId)
  } catch (error: any) {
    console.error("[v0] Error deleting comment:", error)
    throw error
  }
}

export async function createNotification(notification: Omit<Notification, "id">): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase not configured")
  }

  if (!db) {
    throw new Error("Firestore database not initialized")
  }

  try {
    const notificationsRef = collection(db, "notifications")
    const newNotificationRef = doc(notificationsRef)

    await setDoc(newNotificationRef, notification)
    console.log("[v0] Notification created successfully:", newNotificationRef.id)
    return newNotificationRef.id
  } catch (error: any) {
    console.error("[v0] Error creating notification:", error)
    throw error
  }
}

export async function getUserNotifications(userId: string, maxResults = 50): Promise<Notification[]> {
  if (!isFirebaseConfigured()) {
    return []
  }

  if (!db) {
    return []
  }

  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("toUserId", "==", userId), orderBy("createdAt", "desc"), limit(maxResults))

    const querySnapshot = await getDocs(q)
    const notifications: Notification[] = []

    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification)
    })

    return notifications
  } catch (error: any) {
    console.error("[v0] Error getting notifications:", error)
    return []
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!isFirebaseConfigured()) {
    return 0
  }

  if (!db) {
    return 0
  }

  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("toUserId", "==", userId), where("read", "==", false))

    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  } catch (error: any) {
    console.error("[v0] Error getting unread notification count:", error)
    return 0
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return
  }

  if (!db) {
    return
  }

  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      read: true,
    })
  } catch (error: any) {
    console.error("[v0] Error marking notification as read:", error)
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return
  }

  if (!db) {
    return
  }

  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("toUserId", "==", userId), where("read", "==", false))

    const querySnapshot = await getDocs(q)
    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
      }),
    )

    await Promise.all(updatePromises)
    console.log("[v0] All notifications marked as read")
  } catch (error: any) {
    console.error("[v0] Error marking all notifications as read:", error)
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return
  }

  if (!db) {
    return
  }

  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await deleteDoc(notificationRef)
    console.log("[v0] Notification deleted successfully:", notificationId)
  } catch (error: any) {
    console.error("[v0] Error deleting notification:", error)
  }
}

export async function searchPosts(
  searchTerm: string,
  maxResults = 20,
): Promise<{
  posts: Post[]
  lastDoc: any
  hasMore: boolean
}> {
  if (!isFirebaseConfigured()) {
    return { posts: [], lastDoc: null, hasMore: false }
  }

  if (!db) {
    return { posts: [], lastDoc: null, hasMore: false }
  }

  if (!searchTerm.trim()) {
    // If no search term, return regular posts
    return getPosts(maxResults)
  }

  try {
    console.log("[v0] Searching posts for:", searchTerm)
    const postsRef = collection(db, "posts")
    const searchLower = searchTerm.toLowerCase().trim()

    // Check if search term is a hashtag
    const isHashtagSearch = searchLower.startsWith("#")
    const hashtagToSearch = isHashtagSearch ? searchLower.slice(1) : searchLower

    // Fetch all posts (we'll filter client-side for better search results)
    // In production, you'd want to use a proper search service like Algolia
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(100))
    const querySnapshot = await getDocs(q)
    const posts: Post[] = []

    querySnapshot.forEach((doc) => {
      const post = { id: doc.id, ...doc.data() } as Post
      const contentLower = post.content.toLowerCase()

      const postHashtags = post.hashtags && post.hashtags.length > 0 ? post.hashtags : extractHashtags(post.content)

      // Search logic:
      // 1. If searching for a hashtag, match against post hashtags
      // 2. Otherwise, search in post content
      const matchesHashtag = isHashtagSearch && postHashtags.some((tag) => tag.toLowerCase().includes(hashtagToSearch))
      const matchesContent = !isHashtagSearch && contentLower.includes(searchLower)

      if (matchesHashtag || matchesContent) {
        posts.push(post)
      }
    })

    console.log("[v0] Found", posts.length, "matching posts")

    // Return first maxResults posts
    const hasMore = posts.length > maxResults
    const postsToReturn = posts.slice(0, maxResults)
    const lastDoc = hasMore ? querySnapshot.docs[maxResults - 1] : null

    return { posts: postsToReturn, lastDoc, hasMore: false } // Disable pagination for search
  } catch (error: any) {
    console.error("[v0] Error searching posts:", error)
    return { posts: [], lastDoc: null, hasMore: false }
  }
}

export async function getRecommendedProfiles(userId: string, limit = 6, isAdmin = false): Promise<ProfileCard[]> {
  if (!isFirebaseConfigured() || !db || !userId) {
    return []
  }

  try {
    console.log("[v0] Getting recommended profiles for user:", userId)

    // Get user's profile to access their connections
    const userProfileRef = doc(db, "profiles", userId)
    const userProfileSnap = await getDoc(userProfileRef)

    if (!userProfileSnap.exists()) {
      return []
    }

    const userProfile = userProfileSnap.data() as UserProfile
    const userConnections = userProfile.connections || []
    const userConnectionIds = new Set(userConnections.map((c) => c.userId))

    // Get all profiles to find friends of friends
    const profilesRef = collection(db, "profiles")
    const q = isAdmin
      ? query(profilesRef, orderBy("updatedAt", "desc"), firebaseLimit(100))
      : query(profilesRef, where("isPublic", "==", true), orderBy("updatedAt", "desc"), firebaseLimit(100))

    const querySnapshot = await getDocs(q)
    const recommendations: Map<string, { profile: ProfileCard; mutualCount: number }> = new Map()

    // For each connection's connections, count mutual connections
    for (const connection of userConnections) {
      const connProfileRef = doc(db, "profiles", connection.userId)
      const connProfileSnap = await getDoc(connProfileRef)

      if (connProfileSnap.exists()) {
        const connProfile = connProfileSnap.data() as UserProfile
        const theirConnections = connProfile.connections || []

        for (const theirConn of theirConnections) {
          // Skip if it's the user themselves or already connected
          if (theirConn.userId === userId || userConnectionIds.has(theirConn.userId)) {
            continue
          }

          // Count how many mutual connections this profile has
          const existing = recommendations.get(theirConn.userId)
          if (existing) {
            existing.mutualCount++
          } else {
            // Find the full profile card for this user
            querySnapshot.forEach((docSnap) => {
              if (docSnap.id === theirConn.userId) {
                const profile = docSnap.data() as UserProfile
                recommendations.set(theirConn.userId, {
                  profile: {
                    id: docSnap.id,
                    profileName: profile.profileName,
                    profileDescription: profile.profileDescription,
                    profilePicture: profile.profilePicture,
                    backgroundColor: profile.backgroundColor,
                    backgroundImage: profile.backgroundImage,
                    layout: profile.layout,
                    showcaseItemCount: profile.showcaseItems?.length || 0,
                    // Assuming showcaseItem has an imageUrl field, adjust if needed
                    previewImages:
                      profile.showcaseItems?.slice(0, 4).map((item) => item.imageUrl || item.content) || [],
                    isPublic: profile.isPublic,
                    email: profile.email,
                  },
                  mutualCount: 1,
                })
              }
            })
          }
        }
      }
    }

    // Sort by mutual connections and return top results
    const sorted = Array.from(recommendations.values())
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, limit)
      .map((item) => item.profile)

    console.log("[v0] Found", sorted.length, "recommended profiles")
    return sorted
  } catch (error) {
    console.error("[v0] Error getting recommended profiles:", error)
    return []
  }
}

export async function getTrendingProfiles(limit = 3, isAdmin = false): Promise<ProfileCard[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  try {
    console.log("[v0] Getting trending profiles")

    const profilesRef = collection(db, "profiles")

    // Get profiles ordered by update time (most recently updated = most active)
    const q = isAdmin
      ? query(profilesRef, orderBy("updatedAt", "desc"), firebaseLimit(limit * 3))
      : query(profilesRef, where("isPublic", "==", true), orderBy("updatedAt", "desc"), firebaseLimit(limit * 3))

    const querySnapshot = await getDocs(q)
    const profiles: Array<ProfileCard & { score: number }> = []

    querySnapshot.forEach((docSnap) => {
      const profile = docSnap.data() as UserProfile

      // Calculate a "trending score" based on multiple factors
      const itemCount = profile.showcaseItems?.length || 0
      const connectionCount = profile.connections?.length || 0
      // Check for existence and type of updatedAt before calling toMillis
      const lastUpdateTimestamp = profile.updatedAt
      const hasRecentUpdate =
        lastUpdateTimestamp && typeof lastUpdateTimestamp.toMillis === "function"
          ? Date.now() - lastUpdateTimestamp.toMillis() < 7 * 24 * 60 * 60 * 1000 // Within last week
          : false

      // Score: items (up to 20 points) + connections (up to 30 points) + recent activity (50 points)
      const score = Math.min(itemCount * 2, 20) + Math.min(connectionCount * 3, 30) + (hasRecentUpdate ? 50 : 0)

      profiles.push({
        id: docSnap.id,
        profileName: profile.profileName,
        profileDescription: profile.profileDescription,
        profilePicture: profile.profilePicture,
        backgroundColor: profile.backgroundColor,
        backgroundImage: profile.backgroundImage,
        layout: profile.layout,
        showcaseItemCount: itemCount,
        // Assuming showcaseItem has an imageUrl field, adjust if needed. Also check item.content for fallback.
        previewImages: profile.showcaseItems?.slice(0, 4).map((item) => item.imageUrl || item.content) || [],
        isPublic: profile.isPublic,
        email: profile.email,
        score,
      })
    })

    // Sort by score and return top results
    const sorted = profiles.sort((a, b) => b.score - a.score).slice(0, limit)

    console.log("[v0] Found", sorted.length, "trending profiles")
    return sorted
  } catch (error) {
    console.error("[v0] Error getting trending profiles:", error)
    return []
  }
}

export async function getTrendingPosts(maxResults = 10): Promise<Post[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  try {
    const postsRef = collection(db, "posts")
    // Get posts from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const q = query(postsRef, where("createdAt", ">=", sevenDaysAgo), orderBy("createdAt", "desc"), limit(50))

    const querySnapshot = await getDocs(q)
    const posts: Post[] = []

    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post)
    })

    // Sort by engagement (likes + comments + views)
    const sortedPosts = posts.sort((a, b) => {
      // Note: `a.comments` is not directly available in the Post interface. Assuming a structure where comments are nested or aggregated.
      // For now, we'll use `likeCount` and `viewCount` as they are directly on the Post interface.
      // If `commentCount` is intended to be used, it should be available on the Post interface.
      const scoreA = (a.likes?.length || 0) * 3 + (a.commentCount || 0) * 2 + (a.viewCount || 0)
      const scoreB = (b.likes?.length || 0) * 3 + (b.commentCount || 0) * 2 + (b.viewCount || 0)
      return scoreB - scoreA
    })

    return sortedPosts.slice(0, maxResults)
  } catch (error) {
    console.error("[v0] Error getting trending posts:", error)
    return []
  }
}

export async function getRecommendedPosts(userId: string, maxResults = 10): Promise<Post[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  try {
    // Get user's connections
    const userProfile = await getUserProfile(userId)
    if (!userProfile || !userProfile.connections || userProfile.connections.length === 0) {
      return []
    }

    const connectionIds = userProfile.connections.map((c) => c.userId)

    // Get posts from connections
    const postsRef = collection(db, "posts")
    // Firebase limits to 10 items in 'in' query. If more than 10 connections, we'll need to batch or adjust.
    const q = query(
      postsRef,
      where("userId", "in", connectionIds.slice(0, 10)),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    )

    const querySnapshot = await getDocs(q)
    const posts: Post[] = []

    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post)
    })

    return posts
  } catch (error) {
    console.error("[v0] Error getting recommended posts:", error)
    return []
  }
}
