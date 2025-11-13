"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Download, Share2 } from 'lucide-react'
import QRCodeLib from "qrcode"

interface QRBusinessCardProps {
  profileUrl: string
  profileName: string
  profilePicture?: string
}

export function QRBusinessCard({ profileUrl, profileName, profilePicture }: QRBusinessCardProps) {
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open && profileUrl) {
      // Use requestAnimationFrame to ensure canvas is in DOM before drawing
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          QRCodeLib.toCanvas(
            canvasRef.current,
            profileUrl,
            {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
              errorCorrectionLevel: "H",
            },
            (error) => {
              if (error) {
                console.error("[v0] QR code generation error:", error)
              }
            }
          )
        }
      })
    }
  }, [open, profileUrl])

  const handleDownload = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${profileName.replace(/\s+/g, "-")}-portfolio-qr.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
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
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(profileUrl)
          alert("Portfolio link copied to clipboard!")
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl)
        alert("Portfolio link copied to clipboard!")
      } catch (err) {
        console.error("Error copying to clipboard:", err)
      }
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
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="max-w-full h-auto"
              style={{ display: "block" }}
            />
          </div>
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
              Share Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
