// Image compression and validation utilities

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

export async function compressImage(file: File, options: ImageCompressionOptions = {}): Promise<string> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.8, maxSizeKB = 500 } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress the image
      ctx?.drawImage(img, 0, 0, width, height)

      // Try different quality levels to meet size requirements
      let currentQuality = quality
      let compressedDataUrl = canvas.toDataURL("image/jpeg", currentQuality)

      // Estimate size in KB (base64 is ~33% larger than binary)
      const estimatedSizeKB = (compressedDataUrl.length * 0.75) / 1024

      // Reduce quality if still too large
      while (estimatedSizeKB > maxSizeKB && currentQuality > 0.1) {
        currentQuality -= 0.1
        compressedDataUrl = canvas.toDataURL("image/jpeg", currentQuality)
        const newEstimatedSizeKB = (compressedDataUrl.length * 0.75) / 1024
        if (newEstimatedSizeKB <= maxSizeKB) break
      }

      console.log(`[v0] Image compressed: ${file.size} bytes -> ~${Math.round(estimatedSizeKB)}KB`)
      resolve(compressedDataUrl)
    }

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"))
    }

    img.src = URL.createObjectURL(file)
  })
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" }
  }

  // Check file size (10MB limit before compression)
  const maxSizeMB = 10
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Image must be smaller than ${maxSizeMB}MB` }
  }

  return { valid: true }
}

export async function processImageUpload(file: File, options: ImageCompressionOptions = {}): Promise<string> {
  // Validate the file first
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Compress the image
  try {
    const compressedImage = await compressImage(file, options)

    // Final size check for Firestore
    const finalSizeKB = (compressedImage.length * 0.75) / 1024
    if (finalSizeKB > 800) {
      // Leave some buffer for other document data
      throw new Error(`Compressed image is still too large (${Math.round(finalSizeKB)}KB). Please use a smaller image.`)
    }

    return compressedImage
  } catch (error) {
    console.error("[v0] Error processing image:", error)
    throw error
  }
}
