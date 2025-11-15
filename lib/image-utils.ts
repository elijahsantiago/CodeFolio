// Image compression and validation utilities

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

export async function compressImage(file: File, options: ImageCompressionOptions = {}): Promise<string> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.9, maxSizeKB = 500 } = options

  if (file.type === "image/gif") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Calculate base64 size in KB
        const sizeKB = (result.length * 0.75) / 1024

        // Allow GIFs up to 1.5MB in base64 format (about 1.1MB actual)
        // Note: Very large GIFs may cause Firestore document size issues
        if (sizeKB > 1500) {
          reject(
            new Error(
              `GIF is too large (${Math.round(sizeKB)}KB). Please use a GIF smaller than 1.5MB to fit within storage limits.`,
            ),
          )
        } else {
          console.log(`[v0] GIF loaded: ~${Math.round(sizeKB)}KB (animation preserved)`)
          resolve(result)
        }
      }
      reader.onerror = () => reject(new Error("Failed to load GIF"))
      reader.readAsDataURL(file)
    })
  }

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

      while (estimatedSizeKB > maxSizeKB * 1.2 && currentQuality > 0.5) {
        currentQuality -= 0.05
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
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" }
  }

  const maxSizeMB = file.type === "image/gif" ? 2 : 10 // 2MB for GIFs, 10MB for other images
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `${file.type === "image/gif" ? "GIF" : "Image"} must be smaller than ${file.type === "image/gif" ? "2MB" : "10MB"}`,
    }
  }

  return { valid: true }
}

export function shouldUseBlobStorage(file: File): boolean {
  // Use Blob storage for files larger than 300KB to avoid Firestore document size limits
  // GIFs especially benefit from Blob storage since they can't be compressed
  const sizeKB = file.size / 1024
  
  if (file.type === "image/gif" && sizeKB > 300) {
    return true
  }
  
  // For other images, use Blob if over 500KB
  if (file.type.startsWith("image/") && sizeKB > 500) {
    return true
  }
  
  return false
}

export async function uploadToBlob(file: File, userId: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("userId", userId)
  
  const response = await fetch("/api/upload-showcase-item", {
    method: "POST",
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload to Blob storage")
  }
  
  const data = await response.json()
  return data.url
}

export async function processImageUpload(file: File, options: ImageCompressionOptions = {}, userId: string): Promise<string> {
  // Validate the file first
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Check if the file should use Blob storage
  if (shouldUseBlobStorage(file)) {
    return uploadToBlob(file, userId)
  }

  // Compress the image
  try {
    const compressedImage = await compressImage(file, options)

    const finalSizeKB = (compressedImage.length * 0.75) / 1024
    const maxSize = file.type === "image/gif" ? 1500 : 1000
    if (finalSizeKB > maxSize) {
      throw new Error(
        `${file.type === "image/gif" ? "GIF" : "Compressed image"} is still too large (${Math.round(finalSizeKB)}KB). Please use a smaller ${file.type === "image/gif" ? "GIF" : "image"}.`,
      )
    }

    return compressedImage
  } catch (error) {
    console.error("[v0] Error processing image:", error)
    throw error
  }
}
