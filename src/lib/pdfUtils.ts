import jsPDF from "jspdf";

/**
 * Fetches and converts a logo URL to base64 for PDF embedding
 */
export async function getCompanyLogoBase64(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return null;
  }
}

/**
 * Adds company logo to PDF at specified position
 * Returns the height used by the logo (for positioning subsequent content)
 */
export function addLogoToPdf(
  doc: jsPDF,
  logoBase64: string | null,
  x: number,
  y: number,
  maxWidth: number = 40,
  maxHeight: number = 20
): number {
  if (!logoBase64) return 0;

  try {
    // Add the image with auto-sizing
    doc.addImage(logoBase64, "AUTO", x, y, maxWidth, maxHeight, undefined, "FAST");
    return maxHeight + 5; // Return height used plus some padding
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
    return 0;
  }
}

/**
 * Colors commonly used in PDFs
 */
export const PDF_COLORS = {
  PRIMARY: [13, 148, 136] as [number, number, number],   // teal-600 (kept for status badges)
  DARK: [15, 23, 42] as [number, number, number],        // slate-900 - MAIN HEADING COLOR
  MUTED: [100, 116, 139] as [number, number, number],    // slate-500
  WHITE: [255, 255, 255] as [number, number, number],
  LIGHT_GRAY: [241, 245, 249] as [number, number, number], // slate-100
  HEADER_BG: [34, 197, 94] as [number, number, number],  // green-500 - BYGGIO GREEN
  BLUE: [59, 130, 246] as [number, number, number],      // blue-500
  GREEN: [34, 197, 94] as [number, number, number],      // green-500
  RED: [239, 68, 68] as [number, number, number],        // red-500
  AMBER: [245, 158, 11] as [number, number, number],     // amber-500
  BYGGIO_GREEN: [34, 197, 94] as [number, number, number], // green-500 - Primary brand color
};
