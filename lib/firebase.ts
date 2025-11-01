import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  )
}

let app: any = null
let auth: any = null
let db: any = null
let firestoreError: string | null = null

if (isFirebaseConfigured()) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)

    // Firebase Firestore cannot be initialized in the v0 environment due to module resolution issues
    // This is a known v0 platform regression that occurred around 2 days ago
    db = null
    firestoreError =
      "Firebase Firestore is incompatible with the v0 preview environment. Deploy to Vercel for full functionality."

    console.warn("[v0] ⚠️  Firebase Firestore is disabled in v0 preview")
    console.warn("[v0] 📝 Your posts exist in Firebase but cannot be accessed here")
    console.warn("[v0] ✅ Solution: Deploy your app to Vercel where Firestore works correctly")
    console.warn("[v0] 🔧 Alternative: Switch to Supabase or Neon (v0-supported databases)")
    console.warn("[v0] 📞 Report: Contact v0 support at vercel.com/help about this regression")
  } catch (error) {
    console.warn("[v0] Firebase initialization failed:", error)
  }
}

export { auth, db, isFirebaseConfigured, firestoreError }
export default app
