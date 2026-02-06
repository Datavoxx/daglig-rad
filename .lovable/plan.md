
Mål: På iOS (MediaRecorder → backend-transkribering) ska transkriberingen sluta “hallucinera” långa texter och i stället antingen (a) ge korrekt, kort transkript, eller (b) returnera “[ohörbart]”/”för kort inspelning” när ljudet är tyst/korrupt.

Bakgrund (vad jag ser i koden)
- iOS använder MediaRecorder och transkriberar först efter stop.
- cancel-flödet stoppar MediaRecorder men `onstop` transkriberar ändå (det finns ingen “avbryt transkribering”-flagga).
- Vid start av iOS-inspelning nollställs inte `finalTranscript`/refs konsekvent (risk för att gammal text lever kvar i UI/confirm).
- Backend kör ett multimodalt LLM-ljudprompt (Gemini) utan “anti-guess”-hårdspärrar (temp/top_p) och utan korta output-gränser. Om ljudet är tyst/trasigt kan modellen hitta på text.

Hypoteser som kan förklara “HEEELT ANNAT” lång text
1) Tyst/korrupt ljud skickas ibland (särskilt om inspelningen blir väldigt kort, eller om stream/codec inte blir korrekt) → modellen gissar.
2) Cancel/avbrott triggar ändå transkribering av ett “tomt” klipp → modellen gissar.
3) UI kan visa äldre transcript eller fel kombination av transcript-state (mindre sannolikt men enkelt att säkra).

Plan (implementation)

A) Gör MediaRecorder-flödet deterministiskt och “anti-hallucination”-vänligt (frontend)
1) Lägg till en ref-flagga som styr om `onstop` ska transkribera
   - `shouldTranscribeRef.current = true` vid normal start
   - Sätt `shouldTranscribeRef.current = false` i `cancelRecording()`
   - I `mediaRecorder.onstop`, returnera tidigt om flaggan är false (och rensa chunks)
   Effekt: Avbryt ska aldrig transkribera “skräp”.

2) Nollställ transkript-state vid start för iOS-läget
   - Vid `startMediaRecording()`:
     - `setInterimTranscript("")`
     - `setFinalTranscript("")`
     - `finalTranscriptRef.current = ""`
   Effekt: Ingen risk att gammal text råkar visas/återanvändas.

3) Inför hårda sanity-checks innan vi ens anropar transkribering
   - Mät inspelningslängd och/eller minsta blob-storlek
     - Ex: om `audioBlob.size < 8000` bytes (justeras efter test) → toast “Inspelningen blev för kort, försök igen” och avbryt transkribering.
   - (Valfritt men rekommenderat) spåra starttid med `recordingStartMsRef` och kräva t.ex. minst 800–1200 ms inspelning.
   Effekt: Vi undviker att skicka tyst/trasigt klipp som triggar hallucination.

4) Förbättra loggning för felsökning (utan att logga ljuddata)
   - Logga: duration (ms), blob.size, mimeType, number of chunks, och om sanity-check stoppade transkribering.
   Effekt: Vi kan se om problemet är “för kort/tyst/codec”.

B) Strama upp backend-transkriberingen (edge function) för att minimera gissningar
5) Byt modell till standardrekommendationen för Lovable AI när inget annat är önskat
   - Byt från `google/gemini-2.5-flash` → `google/gemini-3-flash-preview`
   Motiv: nyare modell, ofta bättre på robusthet.

6) Lägg till “do-not-guess”-parametrar och begränsa output
   - Sätt `temperature: 0`
   - Sätt `top_p: 0.1` (eller 0.2)
   - Sätt en rimlig `max_tokens` (t.ex. 200–400) för att förhindra absurdt långa svar vid fel input
   Effekt: Mindre kreativitet, mindre risk att den fyller ut med påhitt.

7) Skärp prompten med ett explicit “ingen gissning”-kontrakt
   - Lägg till punkt som säger:
     - “Gissa inte. Om du inte tydligt hör orden, returnera exakt `[ohörbart]` och inget annat.”
   Effekt: När ljudet är otydligt ska den hellre ge “[ohörbart]” än hitta på.

8) (Valfritt) Strikt post-processing på backend
   - Om svaret är oproportionerligt långt relativt ljudets storlek/duration (som vi kan skicka in som metadata), returnera error eller “[ohörbart]”.
   Not: Detta kräver att frontend skickar med `durationMs` och att vi gör enkla heuristiker.

C) UI/UX (så användaren ser vad som händer och kan agera)
9) Uppdatera iOS-overlay-texten
   - Visa tydligt “Transkriberar…” efter stop
   - Vid sanity-check fail: “För kort inspelning” istället för att försöka transkribera.

Filer som ändras
- `src/hooks/useVoiceRecorder.ts`
  - shouldTranscribeRef + start-reset + sanity-checks + bättre loggar
- `supabase/functions/transcribe-audio/index.ts`
  - modellbyte + temperature/top_p/max_tokens + promptskärpning + (ev.) heuristik

Testplan (det du verifierar)
1) iPhone Safari: spela in 2–3 sek och säg exakt “Skriv att vi ska byta fasad.”
   - Förväntat: Transkriptet ska vara mycket nära exakt meningen (med ev. skiljetecken).
2) iPhone Safari: tryck start och stop direkt (<1s)
   - Förväntat: “För kort inspelning” (ingen lång fejktext).
3) iPhone Safari: start och tryck Avbryt
   - Förväntat: Ingen transkribering sker, inga nätverksanrop till transcribe-audio.
4) Regressions: Desktop Chrome/Edge (Web Speech API) ska fungera som innan.

Om detta fortfarande kvarstår efter ovan
- Då pekar det starkt på att iOS MediaRecorder levererar ljud som modellen tolkar fel (codec/containermismatch). Nästa steg blir att:
  - byta inspelningsmime till “audio/mp4” enbart och fallbacka hårdare
  - eller gå över till en riktig STT-tjänst (betald) för iOS för deterministiska resultat.
