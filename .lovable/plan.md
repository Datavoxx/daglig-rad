
# Plan: Fixa transkribering som inte tolkar ljudet

## Problemanalys

Loggarna visar att:
- Ljudfilen skickas korrekt (462KB, 20 sekunder, audio/mp4)
- AI-modellen svarar: "Vänligen tillhandahåll ljudfilen..."

**Orsak:** Gemini-modellen via Lovable AI Gateway får inte ljuddata i rätt format. Antingen:
1. `input_audio`-formatet stöds inte av denna gateway/modell
2. Base64-datan behöver skickas som `image_url` med data-URI istället

## Lösning

Ändra hur ljudet skickas till AI-modellen. Enligt OpenAI/Gemini-kompatibla APIs ska audio skickas som en data-URI i `image_url`-fältet (som också hanterar audio):

```typescript
// NUVARANDE (fungerar inte):
{
  type: "input_audio",
  input_audio: { data: audio, format: "mp4" }
}

// NYTT (data-URI format):
{
  type: "image_url",
  image_url: {
    url: `data:audio/mp4;base64,${audio}`
  }
}
```

Alternativt, om Lovable AI Gateway stöder OpenAI's audio-format:

```typescript
{
  type: "audio_url",
  audio_url: {
    url: `data:audio/mp4;base64,${audio}`
  }
}
```

## Fil som ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/transcribe-audio/index.ts` | Ändra content-format för audio |

## Teknisk implementation

### transcribe-audio/index.ts

1. Ändra meddelande-strukturen från `input_audio` till data-URI format
2. Testa med `image_url` (som vissa APIs använder för multimodalt innehåll)
3. Om det inte fungerar, fallback till explicit audio data-URI

```typescript
// Bygg data-URI för ljudfilen
const audioDataUri = `data:${mimeType || 'audio/mp4'};base64,${audio}`;

messages: [
  {
    role: "system",
    content: `...`
  },
  {
    role: "user",
    content: [
      {
        type: "text",
        text: "Transkribera följande ljudinspelning ordagrant:"
      },
      {
        type: "image_url",  // Multimodal content type
        image_url: {
          url: audioDataUri
        }
      }
    ]
  }
]
```

## Fallback: Byt till annan modell

Om ovanstående inte fungerar, kan vi testa:
- `openai/gpt-5` som har bekräftat stöd för audio
- `google/gemini-2.5-flash` med annan syntax

## Testplan

1. Spela in på iPhone Safari med ~5-10 sekunders tal
2. Verifiera att transkriberingen innehåller det du faktiskt sa
3. Kontrollera loggarna för att se att modellen får ljudet

## Sammanfattning

Problemet är att AI-modellen inte "ser" ljudfilen trots att den skickas. Lösningen är att ändra hur ljuddatan formateras i API-anropet - från `input_audio` till data-URI format som är mer standardiserat för multimodala API:er.
