"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, User, MessageCircle } from "lucide-react"
import {
  respondToConnectionRequest,
  getUserProfile,
  getPendingConnectionRequests,
  getConnectionRequestCount,
  getUserNotifications,
  getUnreadNotificationCount,
  deleteNotification,
  type ConnectionRequest,
  type Notification,
} from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface NotificationsPanelProps {
  buttonStyle?: React.CSSProperties
}

export function NotificationsPanel({ buttonStyle }: NotificationsPanelProps) {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const router = useRouter()
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadCounts()
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      loadAllNotifications()
    }
  }, [isOpen, user])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      if (isOpen) {
        loadAllNotifications()
      } else {
        loadCounts()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user, isOpen])

  const loadCounts = async () => {
    if (!user) return

    try {
      const [requestCount, notificationCount] = await Promise.all([
        getConnectionRequestCount(user.uid),
        getUnreadNotificationCount(user.uid),
      ])
      setTotalCount(requestCount + notificationCount)
    } catch (error) {
      console.error("[v0] Error loading counts:", error)
    }
  }

  const loadAllNotifications = async () => {
    if (!user) return

    try {
      const [pendingRequests, userNotifications] = await Promise.all([
        getPendingConnectionRequests(user.uid),
        getUserNotifications(user.uid),
      ])
      setRequests(pendingRequests)
      setNotifications(userNotifications)
      setTotalCount(pendingRequests.length + userNotifications.filter((n) => !n.read).length)
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
    }
  }

  const handleResponse = async (request: ConnectionRequest, accept: boolean) => {
    if (!user || !profile) return

    try {
      setLoading(request.id)

      const requesterProfile = await getUserProfile(request.fromUserId)
      if (!requesterProfile) {
        console.error("[v0] Requester profile not found")
        return
      }

      await respondToConnectionRequest(user.uid, request.id, accept, requesterProfile)

      await loadAllNotifications()

      if (updateProfile) {
        const updatedProfile = await getUserProfile(user.uid)
        if (updatedProfile) {
          await updateProfile(updatedProfile)
        }
      }
    } catch (error) {
      console.error("[v0] Error responding to connection request:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await deleteNotification(notification.id)

      // Navigate to the post
      if (notification.postId) {
        setIsOpen(false)
        router.push(`/?post=${notification.postId}`)
      }

      // Reload notifications
      await loadAllNotifications()
    } catch (error) {
      console.error("[v0] Error handling notification click:", error)
    }
  }

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await deleteNotification(notificationId)
      await loadAllNotifications()
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent" style={buttonStyle}>
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {requests.length === 0 && notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
            ) : (
              <>
                {/* Connection Requests */}
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.fromUserPicture || "/placeholder.svg"} alt={request.fromUserName} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{request.fromUserName}</p>
                      <p className="text-xs text-muted-foreground">wants to connect</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResponse(request, true)}
                        disabled={loading === request.id}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResponse(request, false)}
                        disabled={loading === request.id}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Comment Reply Notifications */}
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors ${
                      notification.read ? "bg-muted/30" : "bg-muted/50"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={notification.fromUserPicture || "/placeholder.svg"}
                        alt={notification.fromUserName}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">{notification.fromUserName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">replied to your comment</p>
                      {notification.commentContent && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          "{notification.commentContent}"
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
