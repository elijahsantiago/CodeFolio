/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.0 formula
 */
export function getLuminance(hex: string): number {
  // Remove # if present
  const color = hex.replace("#", "")

  // Convert to RGB
  const r = Number.parseInt(color.substr(0, 2), 16) / 255
  const g = Number.parseInt(color.substr(2, 2), 16) / 255
  const b = Number.parseInt(color.substr(4, 2), 16) / 255

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Determine if a color is dark or light
 * Returns true if the color is dark (luminance < 0.5)
 */
export function isDark(hex: string): boolean {
  return getLuminance(hex) < 0.5
}

/**
 * Get appropriate text color for a given background
 * Returns white for dark backgrounds, black for light backgrounds
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isDark(backgroundColor) ? "#ffffff" : "#000000"
}

/**
 * Adjust colors for theme switching
 * Returns theme-appropriate color values
 */
export function getThemeColors(theme: "light-business" | "dark-business" | "business-casual") {
  switch (theme) {
    case "dark-business":
      return {
        backgroundColor: "#0a0a0a",
        contentBoxColor: "#1a1a1a",
        contentBoxTrimColor: "#3a3a3a",
        profileInfoColor: "#1a1a1a",
        profileInfoTrimColor: "#3a3a3a",
        textColor: "#ffffff", // Added textColor for dark theme
      }
    case "business-casual":
      return {
        backgroundColor: "#f5f5f0",
        contentBoxColor: "#ffffff",
        contentBoxTrimColor: "#d4a574",
        profileInfoColor: "#ffffff",
        profileInfoTrimColor: "#d4a574",
        textColor: "#1a1a1a", // Added textColor for business casual theme
      }
    case "light-business":
    default:
      return {
        backgroundColor: "#ffffff",
        contentBoxColor: "#f9fafb",
        contentBoxTrimColor: "#e5e7eb",
        profileInfoColor: "#f9fafb",
        profileInfoTrimColor: "#e5e7eb",
        textColor: "#000000", // Added textColor for light theme
      }
  }
}
