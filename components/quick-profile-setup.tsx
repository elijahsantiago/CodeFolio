"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, User, FileText, Camera } from "lucide-react"

interface QuickProfileSetupProps {
  onComplete: (data: {
    profileName: string
    profileDescription: string
    profilePicture?: string
  }) => void
  onSkip: () => void
}

export function QuickProfileSetup({ onComplete, onSkip }: QuickProfileSetupProps) {
  const [profileName, setProfileName] = useState("")
  const [profileDescription, setProfileDescription] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = (file: File) => {
    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setProfilePicture(result)
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileName.trim()) return

    onComplete({
      profileName: profileName.trim(),
      profileDescription: profileDescription.trim() || "Welcome to my profile!",
      profilePicture: profilePicture || undefined,
    })
  }

  const quickProfiles = [
    {
      name: "Creative Professional",
      description: "I'm a creative professional passionate about design, innovation, and bringing ideas to life.",
      icon: "🎨",
    },
    {
      name: "Tech Enthusiast",
      description: "Technology lover, always exploring the latest innovations and building cool projects.",
      icon: "💻",
    },
    {
      name: "Business Professional",
      description: "Experienced professional focused on growth, leadership, and making meaningful connections.",
      icon: "💼",
    },
  ]

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="profileName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Your Name
          </Label>
          <Input
            id="profileName"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <Label htmlFor="profileDescription" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            About You
          </Label>
          <Textarea
            id="profileDescription"
            value={profileDescription}
            onChange={(e) => setProfileDescription(e.target.value)}
            placeholder="Tell others about yourself..."
            rows={3}
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Profile Picture (Optional)
          </Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                }}
                className="flex-1"
                disabled={isUploading}
              />
              <Button type="button" variant="outline" size="sm" disabled={isUploading}>
                <Upload className="h-3 w-3 mr-1" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {profilePicture && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Camera className="h-4 w-4" />
                Profile picture ready!
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1" disabled={!profileName.trim()}>
            Create Profile
          </Button>
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </form>

      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Quick Start Templates</Label>
        <div className="space-y-2">
          {quickProfiles.map((template, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left h-auto p-3 bg-transparent"
              onClick={() => {
                setProfileName(template.name)
                setProfileDescription(template.description)
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{template.icon}</span>
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{template.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
