"use client"

import { GraduationCap, CheckCircle2, Award } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface VerificationBadgeProps {
  type: "student" | "portfolio" | "certification"
  verified: boolean
  metadata?: {
    schoolName?: string
    certificationName?: string
  }
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function VerificationBadge({
  type,
  verified,
  metadata,
  size = "md",
  showLabel = false,
}: VerificationBadgeProps) {
  if (!verified) return null

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const badges = {
    student: {
      icon: GraduationCap,
      label: "Student Verified",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      description: metadata?.schoolName
        ? `Verified student at ${metadata.schoolName}`
        : "Verified student with school email",
    },
    portfolio: {
      icon: CheckCircle2,
      label: "Portfolio Verified",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      description: "Complete portfolio with verified resume",
    },
    certification: {
      icon: Award,
      label: "Certified",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      description: metadata?.certificationName ? `Certified: ${metadata.certificationName}` : "Verified certification",
    },
  }

  const badge = badges[type]
  const Icon = badge.icon

  const BadgeContent = (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1", badge.bg)}>
      <Icon className={cn(sizeClasses[size], badge.color)} />
      {showLabel && <span className={cn("text-xs font-medium", badge.color)}>{badge.label}</span>}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{badge.label}</p>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface VerificationBadgesDisplayProps {
  badges?: Array<{
    type: "student" | "portfolio" | "certification"
    verified: boolean
    metadata?: {
      schoolName?: string
      certificationName?: string
    }
  }>
  size?: "sm" | "md" | "lg"
  showLabels?: boolean
}

export function VerificationBadgesDisplay({ badges, size = "md", showLabels = false }: VerificationBadgesDisplayProps) {
  if (!badges || badges.length === 0) return null

  const verifiedBadges = badges.filter((b) => b.verified)
  if (verifiedBadges.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {verifiedBadges.map((badge, index) => (
        <VerificationBadge
          key={`${badge.type}-${index}`}
          type={badge.type}
          verified={badge.verified}
          metadata={badge.metadata}
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  )
}
