

# Plan: Lägg till ElevenLabs Scribe Realtime för iOS Safari

## Översikt

| Platform | Metod | Realtid | Kostnad |
|----------|-------|---------|---------|
| Desktop (Chrome/Edge) | Web Speech API | ✅ Ja | Gratis |
| iOS Safari | ElevenLabs Scribe v2 Realtime | ✅ Ja | Per minut |

## Krav: ElevenLabs API-nyckel

Du behöver en ElevenLabs API-nyckel för att detta ska fungera:
1. Gå till [elevenlabs.io](https://elevenlabs.io) och skapa ett konto
2. Navigera till "Profile" → "API Keys"
3. Kopiera din API-nyckel

Jag kommer be dig lägga till nyckeln som en hemlighet i projektet.

## Filer som skapas/ändras

### 1. Ny Edge Function: `elevenlabs-scribe-token`

Skapar engångstoken för säker anslutning till ElevenLabs WebSocket.

```typescript
// supabase/functions/elevenlabs-scribe-token/index.ts
serve(async (req) => {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  
  const response = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    }
  );
  
  const { token } = await response.json();
  return new Response(JSON.stringify({ token }));
});
```

### 2. Uppdatera `supabase/config.toml`

Lägg till den nya funktionen.

### 3. Nytt paket: `@elevenlabs/react`

Lägg till ElevenLabs React SDK för `useScribe` hook.

### 4. Uppdatera `src/hooks/useVoiceRecorder.ts`

Byt ut MediaRecorder-fallback mot ElevenLabs Scribe Realtime för iOS:

**Ny logik:**

```text
if (isIOSDevice) {
  1. Hämta engångstoken från edge function
  2. Anslut till ElevenLabs WebSocket med useScribe
  3. Streama mikrofon-ljud till ElevenLabs
  4. Visa partialTranscript i realtid (ord för ord!)
  5. committedTranscript → finalTranscript
} else {
  Befintlig Web Speech API (oförändrad)
}
```

**Callbacks:**
- `onPartialTranscript` → uppdaterar `interimTranscript` (realtid!)
- `onCommittedTranscript` → uppdaterar `finalTranscript`

### 5. Uppdatera `src/components/shared/VoiceInputOverlay.tsx`

Ta bort meddelandet "Transkribering sker efter inspelning..." och visa istället realtidstext även på iOS:

```tsx
{/* Samma realtidsvy för både iOS och desktop */}
{(finalTranscript || interimTranscript) && (
  <div className="text-sm bg-muted/50 rounded p-2">
    {finalTranscript && <span>{finalTranscript} </span>}
    {interimTranscript && <span className="italic opacity-70">{interimTranscript}</span>}
  </div>
)}
```

## Tekniskt flöde för iOS (efter implementation)

```text
1. Användaren trycker "Spela in" på iPhone
2. Hook detekterar iOS Safari
3. Hämtar engångstoken från elevenlabs-scribe-token edge function
4. Ansluter till ElevenLabs WebSocket
5. Mikrofon startar → ljud streamas till ElevenLabs
6. Partial transcripts kommer tillbaka i realtid (~150ms latens)
7. Text visas ord för ord medan användaren pratar
8. Användaren trycker "Stoppa"
9. Final transcript visas i bekräftelsedialogrutan
```

## Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `package.json` | Lägg till `@elevenlabs/react` |
| `supabase/functions/elevenlabs-scribe-token/index.ts` | **NY** - Token-generering |
| `supabase/config.toml` | Lägg till ny function |
| `src/hooks/useVoiceRecorder.ts` | Ersätt MediaRecorder med ElevenLabs Scribe |
| `src/components/shared/VoiceInputOverlay.tsx` | Visa realtidstext för iOS |

## Resultat efter implementation

- **Samma realtidsupplevelse** på iOS som på desktop
- Text visas **ord för ord** medan du pratar (även på iPhone!)
- **~150ms latens** på iOS via ElevenLabs
- **Gratis** på desktop (Web Speech API)
- **Automatisk VAD** (voice activity detection) för intelligent paus-hantering

