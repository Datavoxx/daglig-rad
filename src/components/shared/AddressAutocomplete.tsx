import React, { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

const GOOGLE_API_KEY = "AIzaSyDk_9TjgYnd-MmG2BQWzxwUIVaECsZcE4M";

export interface AddressData {
  formatted: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onStructuredChange?: (data: AddressData) => void;
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

function parseAddressComponents(place: google.maps.places.PlaceResult): AddressData {
  const components = place.address_components || [];
  
  const postalCode = components.find(c => 
    c.types.includes("postal_code"))?.long_name;
  
  const city = components.find(c => 
    c.types.includes("locality") || c.types.includes("postal_town"))?.long_name;
  
  return {
    formatted: place.formatted_address || "",
    postalCode,
    city,
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng(),
  };
}

export const AddressAutocomplete = React.forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  function AddressAutocomplete({ value, onChange, onStructuredChange, placeholder = "Sök adress...", id }, forwardedRef) {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = forwardedRef || internalRef;
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApiReady, setIsApiReady] = useState(false);

    const initializeAutocomplete = useCallback(() => {
      const input = typeof inputRef === 'function' ? null : inputRef.current;
      if (!input || !window.google?.maps?.places) return;

      // Prevent re-initialization
      if (autocompleteRef.current) return;

      try {
        const autocomplete = new window.google.maps.places.Autocomplete(
          input,
          {
            componentRestrictions: { country: "se" },
            fields: ["formatted_address", "address_components", "geometry"],
            types: ["address"],
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onChange(place.formatted_address);
            
            if (onStructuredChange) {
              const addressData = parseAddressComponents(place);
              onStructuredChange(addressData);
            }
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error("Error initializing autocomplete:", error);
      }
    }, [onChange, onStructuredChange, inputRef]);

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
          ref={typeof inputRef === 'function' ? undefined : inputRef}
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
);
