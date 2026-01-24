import { useEffect, useState } from "react";
import { usePalette } from "react-palette";
import { supabase } from "@/integrations/supabase/client";

// Convert HEX to HSL for CSS variables
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");
  
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Calculate if color is dark or light for contrast
function getContrastColor(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Return dark text for light backgrounds, white for dark
  return luminance > 0.5 ? "222 47% 11%" : "0 0% 100%";
}

// Adjust lightness of HSL color
function adjustLightness(hsl: string, amount: number): string {
  const parts = hsl.split(" ");
  const h = parts[0];
  const s = parts[1];
  const l = parseInt(parts[2]);
  const newL = Math.max(0, Math.min(100, l + amount));
  return `${h} ${s} ${newL}%`;
}

interface CompanyThemeData {
  logoUrl: string | null;
  companyName: string | null;
  isCustomTheme: boolean;
  isLoading: boolean;
}

export function useCompanyTheme(): CompanyThemeData {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch logo from company_settings
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from("company_settings")
          .select("logo_url, company_name")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (data?.logo_url) {
          setLogoUrl(data.logo_url);
        }
        if (data?.company_name) {
          setCompanyName(data.company_name);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCompanyData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Extract colors from logo
  const { data: palette, loading: paletteLoading } = usePalette(logoUrl || "");

  // Apply theme when colors change
  useEffect(() => {
    if (!logoUrl || paletteLoading) return;

    // Get the most vibrant color, with fallbacks
    const primaryColor = palette?.vibrant || palette?.darkVibrant || palette?.lightVibrant;
    
    if (primaryColor) {
      const hsl = hexToHsl(primaryColor);
      const contrastColor = getContrastColor(primaryColor);
      const lightHsl = adjustLightness(hsl, 35);
      const darkHsl = adjustLightness(hsl, -15);
      
      // Update CSS variables dynamically
      const root = document.documentElement;
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--primary-foreground", contrastColor);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
      root.style.setProperty("--sidebar-primary-foreground", contrastColor);
      root.style.setProperty("--accent", lightHsl);
      root.style.setProperty("--sidebar-accent", lightHsl);
      root.style.setProperty("--accent-foreground", darkHsl);
    }

    // Cleanup: reset to default when unmounting
    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-primary-foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--sidebar-accent");
      root.style.removeProperty("--accent-foreground");
    };
  }, [palette, logoUrl, paletteLoading]);

  return {
    logoUrl,
    companyName,
    isCustomTheme: !!logoUrl,
    isLoading: isLoading || paletteLoading,
  };
}
