"use client"

import { useState, useEffect } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)

  useEffect(() => {
    const firebaseAvailable = isFirebaseConfigured() && auth
    setIsFirebaseAvailable(firebaseAvailable)

    if (!firebaseAvailable) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseAvailable || !auth) {
      throw new Error("Firebase authentication is not configured")
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isFirebaseAvailable || !auth) {
      throw new Error("Firebase authentication is not configured")
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    if (!isFirebaseAvailable || !auth) {
      throw new Error("Firebase authentication is not configured")
    }

    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    isFirebaseAvailable,
  }
}
