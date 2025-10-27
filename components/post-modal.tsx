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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0 bg-card border-border">
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-card-foreground">Post</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0 hover:bg-muted">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-8">
          <PostCard post={post} currentUserId={currentUserId} onPostDeleted={handlePostDeleted} isClickable={false} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
