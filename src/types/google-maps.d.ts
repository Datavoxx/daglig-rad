declare namespace google.maps.places {
  class Autocomplete {
    constructor(
      inputField: HTMLInputElement,
      opts?: AutocompleteOptions
    );
    addListener(eventName: string, handler: () => void): void;
    getPlace(): PlaceResult;
    setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
    setComponentRestrictions(restrictions: ComponentRestrictions): void;
    setFields(fields: string[]): void;
    setOptions(options: AutocompleteOptions): void;
    setTypes(types: string[]): void;
  }

  interface AutocompleteOptions {
    bounds?: LatLngBounds | LatLngBoundsLiteral;
    componentRestrictions?: ComponentRestrictions;
    fields?: string[];
    placeIdOnly?: boolean;
    strictBounds?: boolean;
    types?: string[];
  }

  interface ComponentRestrictions {
    country: string | string[];
  }

  interface PlaceResult {
    formatted_address?: string;
    address_components?: AddressComponent[];
    geometry?: PlaceGeometry;
    name?: string;
    place_id?: string;
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface PlaceGeometry {
    location: LatLng;
    viewport: LatLngBounds;
  }
}

declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(point: LatLng): LatLngBounds;
    getCenter(): LatLng;
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }
}

interface Window {
  google?: typeof google;
}
