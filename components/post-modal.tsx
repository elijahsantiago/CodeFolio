"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PostCard } from "@/components/post-card"
import type { Post } from "@/lib/firestore"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PostModalProps {
  post: Post | null
  currentUserId?: string
  isOpen: boolean
  onClose: () => void
  onPostDeleted?: (postId: string) => void
}

export function PostModal({ post, currentUserId, isOpen, onClose, onPostDeleted }: PostModalProps) {
  if (!post) return null

  const handlePostDeleted = (postId: string) => {
    onPostDeleted?.(postId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Post</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          <PostCard post={post} currentUserId={currentUserId} onPostDeleted={handlePostDeleted} isClickable={false} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
