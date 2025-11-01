"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Loader2, X } from "lucide-react"
import { createPost } from "@/lib/firestore"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { processImageUpload } from "@/lib/image-utils"

interface CreatePostFormProps {
  onPostCreated?: () => void
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { profile } = useProfile()
  const { user } = useAuth()

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const compressedImage = await processImageUpload(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
        maxSizeKB: 500,
      })

      setUploadedImage(compressedImage)
      setImageUrl("") // Clear URL input if file is uploaded
      console.log("[v0] Post image processed successfully")
    } catch (error: any) {
      console.error("[v0] Error uploading post image:", error)
      setUploadError(error.message || "Failed to process image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !profile || !content.trim()) return

    setSubmitting(true)
    try {
      const finalImageUrl = uploadedImage || imageUrl || undefined
      await createPost(user.uid, profile.profileName, profile.profilePicture, content, finalImageUrl)

      setContent("")
      setImageUrl("")
      setUploadedImage(null)
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,.gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                    }
                  }}
                  className="flex-1 text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  disabled={submitting || isUploading}
                />
              </div>

              {uploadError && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {uploadError}
                </div>
              )}

              {uploadedImage && !uploadError && (
                <div className="relative">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Upload preview"
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setUploadedImage(null)
                      setUploadError(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground">Or enter an image URL:</div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setUploadedImage(null) // Clear uploaded file if URL is entered
                }}
                placeholder="Image URL (optional)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={submitting || isUploading || !!uploadedImage}
              />
              <p className="text-xs text-muted-foreground">
                Upload images or GIFs (max 10MB, 15MB for GIFs). GIFs preserve animation.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowImageInput(!showImageInput)
                if (showImageInput) {
                  setUploadedImage(null)
                  setImageUrl("")
                  setUploadError(null)
                }
              }}
              disabled={submitting || isUploading}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {showImageInput ? "Remove Image" : "Add Image"}
            </Button>

            <Button onClick={handleSubmit} disabled={!content.trim() || submitting || isUploading} className="gap-2">
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
