
## Try-and-Fallback för Leverantörsfaktura-extraktion

### Översikt

Implementera en intelligent extraktionslösning som automatiskt hanterar både digitala och skannade PDF:er. Systemet försöker först med direkt PDF-extraktion och faller tillbaka till bild-baserad extraktion om det misslyckas.

### Flödesdiagram

```text
┌─────────────────────────────────────────────────────────────────┐
│  PDF uppladdad                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Steg 1: Försök direkt extraktion                               │
│  Modell: google/gemini-2.5-pro                                  │
│  Format: data:application/pdf;base64,...                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
   ┌──────────────┐       ┌──────────────┐
   │   Lyckas     │       │  Misslyckas  │
   │  (digital    │       │  (skannad/   │
   │   PDF)       │       │   komplex)   │
   └──────┬───────┘       └──────┬───────┘
          │                      │
          │                      ▼
          │       ┌─────────────────────────────────────────────┐
          │       │  Steg 2: Konvertera PDF till PNG            │
          │       │  - Använd pdf-lib + canvas-liknande logik   │
          │       │  - Eller skicka som image/png direkt        │
          │       └─────────────────────┬───────────────────────┘
          │                             │
          │                             ▼
          │       ┌─────────────────────────────────────────────┐
          │       │  Steg 3: Försök extraktion med bild         │
          │       │  Format: data:image/png;base64,...          │
          │       └─────────────────────┬───────────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Returnera extraherad data                                      │
│  + metadata: { method: "pdf" | "image", retried: boolean }      │
└─────────────────────────────────────────────────────────────────┘
```

### Tekniska ändringar

| Fil | Ändring |
|-----|---------|
| `supabase/functions/extract-vendor-invoice/index.ts` | Komplett omskrivning med try-fallback logik |

### Detaljerad implementation

#### 1. Fixa CORS-headers (kritiskt)

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

#### 2. Uppgradera till Gemini 2.5 Pro

Byt från `google/gemini-2.5-flash` till `google/gemini-2.5-pro` för bättre dokumenthantering.

#### 3. Try-and-Fallback logik

```typescript
// Steg 1: Försök med PDF direkt
const pdfResult = await tryExtractWithFormat(pdfBase64, "application/pdf");

if (pdfResult.success) {
  return pdfResult.data;
}

// Steg 2: Om PDF misslyckades, testa som generisk bild
// Gemini kan ibland hantera PDF-data bättre när den skickas som "image"
console.log("PDF extraction failed, trying image fallback...");
const imageResult = await tryExtractWithFormat(pdfBase64, "image/png");

if (imageResult.success) {
  return { ...imageResult.data, extractionMethod: "image_fallback" };
}

// Steg 3: Om båda misslyckades, returnera detaljerat fel
throw new Error("Kunde inte extrahera data. Filen kan vara skyddad eller korrupt.");
```

#### 4. Detektera specifika felmeddelanden

```typescript
function shouldRetryAsImage(errorMessage: string): boolean {
  const retryableErrors = [
    "The document has no pages",
    "Unable to process PDF",
    "Invalid document format",
    "Could not parse document"
  ];
  return retryableErrors.some(e => errorMessage.includes(e));
}
```

#### 5. Förbättrad felhantering och loggning

```typescript
// Detaljerad loggning för debugging
console.log(`Extraction attempt: format=${format}, fileSize=${base64.length}`);

// Specifik felhantering för rate limits
if (response.status === 429) {
  return { error: "För många förfrågningar. Försök igen om en stund." };
}
if (response.status === 402) {
  return { error: "AI-kvot uppnådd. Kontakta support." };
}
```

### Komplett Edge Function struktur

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = { /* uppdaterade headers */ };

interface ExtractionResult {
  success: boolean;
  data?: ExtractedInvoice;
  error?: string;
}

async function tryExtract(
  base64: string, 
  mimeType: string,
  apiKey: string
): Promise<ExtractionResult> {
  // AI-anrop med specifik MIME-type
}

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    // Försök 1: PDF direkt
    let result = await tryExtract(pdfBase64, "application/pdf", apiKey);
    
    // Försök 2: Fallback till image om PDF misslyckades
    if (!result.success && shouldRetryAsImage(result.error)) {
      console.log("Retrying with image format...");
      result = await tryExtract(pdfBase64, "image/png", apiKey);
      if (result.success) {
        result.data.extractionMethod = "image_fallback";
      }
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    return new Response(JSON.stringify({ extracted: result.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Felhantering
  }
});
```

### Förväntade resultat

| Scenario | Före | Efter |
|----------|------|-------|
| Digital PDF (text-baserad) | Fungerar ibland | Fungerar alltid (Gemini Pro) |
| Skannad PDF | Misslyckas ("no pages") | Fungerar via image-fallback |
| Skyddad PDF | Misslyckas | Tydligt felmeddelande |
| CORS-fel | Blockeras | Fungerar |

### Metadata i response

Ny metadata returneras för att visa vilken metod som användes:

```typescript
{
  extracted: {
    supplier_name: "...",
    // ... övrig data
    extractionMethod: "pdf" | "image_fallback"
  }
}
```

Frontend kan visa detta för användaren:
- "AI-extraherad" (grön) - normal extraktion
- "AI-extraherad (bildanalys)" (gul) - fallback användes

