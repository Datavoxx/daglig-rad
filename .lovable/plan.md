

# Plan: Fixa felaktig transkribering på iOS

## Problemanalys

Transkriberingen visar fel text på iOS. Detta beror sannolikt på:

1. **Korrupt base64-encoding** - Nuvarande metod kan korrumpera ljuddata
2. **Fel audio-format** - iOS Safari använder primärt MP4/AAC, men koden prioriterar inte detta korrekt
3. **För strikt systemprompt** - AI:n är fokuserad på "byggbranschen" och kan missförstå generellt tal

## Lösning

### Del 1: Fixa base64-encoding

**Problem:** `btoa()` med `String.fromCharCode` kan korrumpera binärdata för stora filer.

**Lösning:** Använd chunk-baserad encoding som hanterar stora filer säkert:

```typescript
// Säker base64-encoding för stora filer
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }
  
  return btoa(chunks.join(""));
}
```

### Del 2: Prioritera rätt audio-format för iOS

**Problem:** iOS Safari stöder primärt `audio/mp4` men koden testar andra format först.

**Lösning:** Ändra prioritetsordningen för iOS:

```typescript
// För iOS, prioritera MP4 först
let mimeType = "audio/webm";
if (isIOSDevice && MediaRecorder.isTypeSupported("audio/mp4")) {
  mimeType = "audio/mp4";
} else if (MediaRecorder.isTypeSupported("audio/mp4")) {
  mimeType = "audio/mp4";
} else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
  mimeType = "audio/webm;codecs=opus";
}
```

### Del 3: Förbättra systemprompt i edge function

**Problem:** Prompten är för fokuserad på byggterminologi.

**Lösning:** Gör prompten mer generell och fokuserad på exakthet:

```typescript
content: `Du är en transkriberings-assistent. 
Din uppgift är att lyssna på ljudinspelningen och skriva ut EXAKT vad som sägs på svenska.
- Skriv ut texten ORDAGRANT - ändra inte ord eller meningar
- Använd korrekt interpunktion
- Om det är svårt att höra något, skriv [ohörbart]
- Returnera ENDAST den transkriberade texten, ingen annan text`
```

### Del 4: Lägg till bättre loggning

Lägg till mer detaljerad loggning för att debugga framtida problem:

```typescript
console.log("Audio blob size:", audioBlob.size, "bytes");
console.log("Audio mimeType:", mimeType);
console.log("Base64 length:", base64Audio.length);
```

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/hooks/useVoiceRecorder.ts` | Fixa base64-encoding + prioritera MP4 för iOS |
| `supabase/functions/transcribe-audio/index.ts` | Förbättra systemprompt + bättre loggning |

## Tekniska ändringar

### useVoiceRecorder.ts

1. Lägg till säker `arrayBufferToBase64` funktion
2. Ändra format-prioritering för iOS (MP4 först)
3. Lägg till loggning av blob-storlek och format

### transcribe-audio/index.ts

1. Ändra systemprompt till mer generell och exakt
2. Lägg till loggning av audio-storlek
3. Behåll stöd för alla format (mp4, webm, ogg, wav)

## Förväntat resultat

- **Korrekt transkribering** av det användaren faktiskt säger
- **Fungerar på iOS Safari** med rätt audio-format
- **Bättre debugging** genom utökad loggning

