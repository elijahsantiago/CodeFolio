"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, User } from "lucide-react"
import {
  respondToConnectionRequest,
  getUserProfile,
  getPendingConnectionRequests,
  type ConnectionRequest,
} from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NotificationsPanelProps {
  buttonStyle?: React.CSSProperties
}

export function NotificationsPanel({ buttonStyle }: NotificationsPanelProps) {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadRequests()
    }
  }, [user])

  const loadRequests = async () => {
    if (!user) return

    try {
      const pendingRequests = await getPendingConnectionRequests(user.uid)
      setRequests(pendingRequests)
    } catch (error) {
      console.error("Error loading connection requests:", error)
    }
  }

  const handleResponse = async (request: ConnectionRequest, accept: boolean) => {
    if (!user || !profile) return

    try {
      setLoading(request.id)

      // Get requester profile
      const requesterProfile = await getUserProfile(request.fromUserId)
      if (!requesterProfile) {
        console.error("Requester profile not found")
        return
      }

      await respondToConnectionRequest(user.uid, request.id, accept, requesterProfile)

      await loadRequests()

      // Refresh profile
      if (updateProfile) {
        const updatedProfile = await getUserProfile(user.uid)
        if (updatedProfile) {
          await updateProfile(updatedProfile)
        }
      }
    } catch (error) {
      console.error("Error responding to connection request:", error)
    } finally {
      setLoading(null)
    }
  }

  const pendingCount = requests.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent" style={buttonStyle}>
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connection Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>
            ) : (
              requests.map((request) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
