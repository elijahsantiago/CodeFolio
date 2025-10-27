"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Loader2 } from "lucide-react"
import { createPost } from "@/lib/firestore"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"

interface CreatePostFormProps {
  onPostCreated?: () => void
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { profile } = useProfile()
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!user || !profile || !content.trim()) return

    setSubmitting(true)
    try {
      await createPost(user.uid, profile.profileName, profile.profilePicture, content, imageUrl || undefined)

      setContent("")
      setImageUrl("")
      setShowImageInput(false)
      onPostCreated?.()
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      alert("Failed to create post")
    } finally {
      setSubmitting(false)
    }
  }

  if (!profile) return null

  return (
    <Card className="p-6">
      <div className="flex gap-3">
        <img
          src={profile.profilePicture || "/placeholder.svg?height=40&width=40&query=profile avatar"}
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px] resize-none"
            disabled={submitting}
          />

          {showImageInput && (
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              disabled={submitting}
            />
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageInput(!showImageInput)}
              disabled={submitting}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {showImageInput ? "Remove Image" : "Add Image"}
            </Button>

            <Button onClick={handleSubmit} disabled={!content.trim() || submitting} className="gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
