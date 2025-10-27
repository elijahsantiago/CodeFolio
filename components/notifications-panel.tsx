"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, User, MessageCircle, Heart } from "lucide-react"
import {
  respondToConnectionRequest,
  getUserProfile,
  getPendingConnectionRequests,
  getConnectionRequestCount,
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
  const [requestCount, setRequestCount] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadRequestCount()
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      loadRequests()
    }
  }, [isOpen, user])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      if (isOpen) {
        loadRequests() // Load full data if panel is open
      } else {
        loadRequestCount() // Only load count if panel is closed
      }
    }, 30000) // Refresh every 30 seconds instead of 10

    return () => clearInterval(interval)
  }, [user, isOpen])

  const loadRequestCount = async () => {
    if (!user) return

    try {
      const count = await getConnectionRequestCount(user.uid)
      setRequestCount(count)
    } catch (error) {
      console.error("[v0] Error loading connection request count:", error)
    }
  }

  const loadRequests = async () => {
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
      setRequestCount(pendingRequests.length)
    } catch (error) {
      console.error("[v0] Error loading connection requests:", error)
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

  const pendingCount = requestCount

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
                        {notification.type === "post_like" ? (
                          <Heart className="h-4 w-4 text-red-500" />
                        ) : (
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium truncate">{notification.fromUserName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.type === "post_like" ? "liked your post" : "replied to your comment"}
                      </p>
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
