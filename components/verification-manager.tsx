"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, CheckCircle2, Award, Upload, Loader2, CheckCircle } from "lucide-react"
import { VerificationBadge } from "./verification-badge"
import type { VerificationBadge as VerificationBadgeType } from "@/lib/firestore"

interface VerificationManagerProps {
  userId: string
  currentBadges?: VerificationBadgeType[]
  onUpdateBadges: (badges: VerificationBadgeType[]) => Promise<void>
}

export function VerificationManager({ userId, currentBadges = [], onUpdateBadges }: VerificationManagerProps) {
  const [loading, setLoading] = useState(false)
  const [studentEmail, setStudentEmail] = useState("")
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certName, setCertName] = useState("")
  const [certIssuer, setCertIssuer] = useState("")

  const hasStudentBadge = currentBadges.some((b) => b.type === "student" && b.verified)
  const hasPortfolioBadge = currentBadges.some((b) => b.type === "portfolio" && b.verified)
  const hasCertificationBadge = currentBadges.some((b) => b.type === "certification" && b.verified)

  const handleStudentVerification = async () => {
    if (!studentEmail.endsWith(".edu") && !studentEmail.endsWith(".ac.uk")) {
      alert("Please enter a valid school email address (.edu or .ac.uk)")
      return
    }

    setLoading(true)
    try {
      // In a real implementation, this would send a verification email
      const schoolDomain = studentEmail.split("@")[1]
      const schoolName = schoolDomain.replace(".edu", "").replace(".ac.uk", "")

      const newBadge: VerificationBadgeType = {
        type: "student",
        verified: true, // In production, this would be false until email is verified
        verifiedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        metadata: {
          schoolEmail: studentEmail,
          schoolName: schoolName.charAt(0).toUpperCase() + schoolName.slice(1),
        },
      }

      const updatedBadges = [...currentBadges.filter((b) => b.type !== "student"), newBadge]
      await onUpdateBadges(updatedBadges)
      alert("Student verification request sent! Check your email to complete verification.")
    } catch (error) {
      console.error("Error verifying student:", error)
      alert("Failed to send verification request")
    } finally {
      setLoading(false)
    }
  }

  const handleCertificationUpload = async () => {
    if (!certFile || !certName || !certIssuer) {
      alert("Please fill in all certification details and upload a file")
      return
    }

    setLoading(true)
    try {
      // In a real implementation, this would upload the file and submit for admin review
      const newBadge: VerificationBadgeType = {
        type: "certification",
        verified: true, // In production, this would be false until admin reviews
        verifiedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        metadata: {
          certificationName: certName,
          certificationIssuer: certIssuer,
          certificationDate: new Date().toISOString().split("T")[0],
        },
      }

      const updatedBadges = [...currentBadges, newBadge]
      await onUpdateBadges(updatedBadges)
      alert("Certification submitted for review!")
      setCertFile(null)
      setCertName("")
      setCertIssuer("")
    } catch (error) {
      console.error("Error submitting certification:", error)
      alert("Failed to submit certification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Your Verification Badges</h3>
        <div className="flex flex-wrap gap-2">
          {currentBadges
            .filter((b) => b.verified)
            .map((badge, index) => (
              <VerificationBadge
                key={`${badge.type}-${index}`}
                type={badge.type}
                verified={badge.verified}
                metadata={badge.metadata}
                showLabel={true}
              />
            ))}
          {currentBadges.filter((b) => b.verified).length === 0 && (
            <p className="text-sm text-muted-foreground">No verified badges yet</p>
          )}
        </div>
      </div>

      {!hasStudentBadge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Student Verification
            </CardTitle>
            <CardDescription>Verify your student status with a .edu or .ac.uk email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-email">School Email Address</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="student@university.edu"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleStudentVerification} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Verify Student Status
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Portfolio Verification
            {hasPortfolioBadge && (
              <Badge variant="secondary" className="ml-auto">
                Verified
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Automatically verified when you complete your portfolio and upload a resume</CardDescription>
        </CardHeader>
        <CardContent>
          {hasPortfolioBadge ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Your portfolio is verified
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add portfolio items and upload your resume to earn this badge
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Certification Verification
          </CardTitle>
          <CardDescription>Upload proof of professional certifications for verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cert-name">Certification Name</Label>
            <Input
              id="cert-name"
              placeholder="AWS Certified Developer"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-issuer">Issuing Organization</Label>
            <Input
              id="cert-issuer"
              placeholder="Amazon Web Services"
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-file">Certification Document (PDF)</Label>
            <Input
              id="cert-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={handleCertificationUpload} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Submit for Verification
          </Button>
          {hasCertificationBadge && (
            <div className="flex items-center gap-2 text-sm text-purple-600 mt-2">
              <CheckCircle className="h-4 w-4" />
              You have verified certifications
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
