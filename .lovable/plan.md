
## Fix: Offert-inspelning, ATA, Arbetsorder och Planering

### Problem 1: API-fel vid offertinspelning (404)
Edge-funktionen `apply-estimate-voice-edits` anropar fel URL: `https://api.lovable.dev/v1/chat/completions` som ger 404. Ska vara `https://ai.gateway.lovable.dev/v1/chat/completions`.

### Problem 2: "Lat Byggio AI hjalpa dig" sitter pa fel plats
- **ATA**: Knappen sitter utanfor dialogen, bredvid rubriken. Ska vara **inne i** "Ny ATA"-dialogen, hogst upp.
- **Arbetsorder**: Samma problem - knappen sitter utanfor dialogen. Ska vara **inne i** "Ny arbetsorder"-dialogen, hogst upp.
- Bada har tomma handlers (`onTranscriptComplete={async () => {}}`) som inte gor nagot.

### Problem 3: Offertinspelning saknar projektbeskrivning och tidsplan
Nar man spelar in en offert ska AI:n aven fylla i projektbeskrivning (scope) och tidsplan (assumptions). Edge-funktionen `apply-estimate-voice-edits` hanterar bara items, inte scope/assumptions.

---

### Losning

#### 1. Fixa API-URL i apply-estimate-voice-edits

| Fil | Andring |
|-----|---------|
| `supabase/functions/apply-estimate-voice-edits/index.ts` | Andra rad 126: `https://api.lovable.dev/v1/chat/completions` till `https://ai.gateway.lovable.dev/v1/chat/completions`. Uppdatera systemprompten och user-prompten sa att den aven hanterar scope (projektbeskrivning) och assumptions (tidsplan). Lagg till dessa falt i JSON-svaret. |

Prompten utvidgas sa att AI:n kan:
- Uppdatera/skapa scope (projektbeskrivning)
- Uppdatera/skapa assumptions (tidsplan, array av strang)
- Uppdatera items som innan

Svarsformatet blir:
```text
{
  "items": [...],
  "scope": "projektbeskrivning...",
  "assumptions": ["Vecka 1: ...", "Vecka 2: ..."],
  "changes_made": "..."
}
```

#### 2. Uppdatera EstimateBuilder-handleren

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | I handleren (rad 414-429): Skicka med `scope` och `assumptions` i body. Hantera `data.scope` och `data.assumptions` i svaret och uppdatera estimate-state. |

#### 3. Flytta VoicePromptButton in i ATA-dialogen med riktig handler

| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectAtaTab.tsx` | (1) Ta bort VoicePromptButton fran rad 439-443 (utanfor dialogen). (2) Lagg till den inne i DialogContent, efter DialogHeader, med en handler som anropar `apply-voice-edits` med `documentType: "ata"` och fyller i formularet (description, reason, unit_price, quantity etc.) baserat pa AI-svaret. |

#### 4. Flytta VoicePromptButton in i arbetsorder-dialogen med riktig handler

| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectWorkOrdersTab.tsx` | (1) Ta bort VoicePromptButton fran rad 229-233 (utanfor dialogen). (2) Lagg till den inne i DialogContent, efter DialogHeader, med en handler som anropar `apply-voice-edits` med `documentType: "work_order"` och fyller i formularet (title, description, assigned_to) baserat pa AI-svaret. |

#### 5. Planering - ingen kodandring behovs

Planeringsfunktionen fungerar korrekt. Den kraver en tillrackligt detaljerad beskrivning for att generera en plan (den svarar `needs_more_info` om beskrivningen ar for vag, t.ex. "forsta veckan ska vi byta fasad" ar inte tillrackligt). VoicePromptButton ar redan korrekt placerad i input-vyn och satter transkriptet i textfaltet.

---

### Sammanfattning

| Fil | Andring |
|------|-----------|
| `supabase/functions/apply-estimate-voice-edits/index.ts` | Fixa API-URL (404-felet), utvidga prompt for scope + assumptions |
| `src/components/estimates/EstimateBuilder.tsx` | Skicka scope/assumptions, hantera dem i svaret |
| `src/components/projects/ProjectAtaTab.tsx` | Flytta VoicePromptButton in i "Ny ATA"-dialogen, lagg till riktig handler |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Flytta VoicePromptButton in i "Ny arbetsorder"-dialogen, lagg till riktig handler |
