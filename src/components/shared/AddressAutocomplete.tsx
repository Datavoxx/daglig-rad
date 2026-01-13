import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

const GOOGLE_API_KEY = "AIzaSyDk_9TjgYnd-MmG2BQWzxwUIVaECsZcE4M";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  id?: string;
}

// Track script loading state globally
let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    // Add to callbacks if currently loading
    if (isScriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    // Check if already in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      if (window.google?.maps?.places) {
        isScriptLoaded = true;
        resolve();
      } else {
        existingScript.addEventListener("load", () => {
          isScriptLoaded = true;
          resolve();
        });
      }
      return;
    }

    // Load script
    isScriptLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoading = false;
      isScriptLoaded = true;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      console.error("Failed to load Google Maps script");
      resolve(); // Resolve anyway to show fallback
    };

    document.head.appendChild(script);
  });
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Sök adress...",
  id,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiReady, setIsApiReady] = useState(false);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Prevent re-initialization
    if (autocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "se" },
          fields: ["formatted_address", "address_components"],
          types: ["address"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }
  }, [onChange]);

  useEffect(() => {
    let mounted = true;

    loadGoogleMapsScript().then(() => {
      if (mounted) {
        setIsLoading(false);
        setIsApiReady(!!window.google?.maps?.places);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isApiReady && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [isApiReady, initializeAutocomplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autocompleteRef.current = null;
    };
  }, []);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
      )}
    </div>
  );
}
