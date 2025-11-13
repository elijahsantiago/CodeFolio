"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Download, Share2 } from "lucide-react"
import QRCodeStyling from "qr-code-styling"
import { useEffect, useRef } from "react"

interface QRBusinessCardProps {
  profileUrl: string
  profileName: string
  profilePicture?: string
}

export function QRBusinessCard({ profileUrl, profileName, profilePicture }: QRBusinessCardProps) {
  const [open, setOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (open && qrRef.current && !qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 300,
        height: 300,
        data: profileUrl,
        margin: 10,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "H",
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 4,
        },
        dotsOptions: {
          type: "rounded",
          color: "#000000",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        image: profilePicture || undefined,
        cornersSquareOptions: {
          type: "extra-rounded",
          color: "#000000",
        },
        cornersDotOptions: {
          type: "dot",
          color: "#000000",
        },
      })

      qrCodeRef.current.append(qrRef.current)
    }
  }, [open, profileUrl, profilePicture])

  const handleDownload = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({
        name: `${profileName}-portfolio-qr`,
        extension: "png",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName}'s Portfolio`,
          text: `Check out ${profileName}'s portfolio!`,
          url: profileUrl,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl)
      alert("Portfolio link copied to clipboard!")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs px-2 sm:px-3 bg-transparent">
          <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Business Card</span>
          <span className="sm:hidden">QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Digital Business Card</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border" ref={qrRef} />
          <div className="text-center">
            <p className="font-medium text-lg">{profileName}</p>
            <p className="text-sm text-muted-foreground">Scan to view portfolio</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
