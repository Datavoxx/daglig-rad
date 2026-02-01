

## Uppdatera AI-prompter för att förstå "Tidsplan"

### Problemanalys

**Vad händer nu**: När du säger "Byte av fasad. Tidsplan: två veckor" så hamnar all text i **Projektbeskrivning** istället för att "två veckor" placeras i **Tidsplan**-fältet.

**Orsak**: AI:n i röststyrningen vet inte att "Tidsplan" i användargränssnittet motsvarar `assumptions`-fältet. Prompten säger fortfarande "Arbete som ingår" och "Antaganden" - gamla namn som inte längre används.

### Vad som ska ändras

| Fil | Problem | Lösning |
|-----|---------|---------|
| `apply-full-estimate-voice/index.ts` | Rad 119: `assumptions: Lista med "Arbete som ingår"` | Ändra till `assumptions: Tidsplan (planerade moment/tidsramar)` |
| `apply-full-estimate-voice/index.ts` | Rad 284: `Arbete som ingår:` i prompten | Ändra till `Tidsplan:` |
| `generate-estimate/index.ts` | Rad 171, 219: `assumptions: ["Antaganden"]` | Ändra till tidsplan-relaterade exempel |
| `apply-summary-voice-edits/index.ts` | Rad 85: `assumptions: ["array med antaganden"]` | Ändra till tidsplan-termer |

### Teknisk implementation

#### 1. apply-full-estimate-voice/index.ts

Uppdatera systempromptens strukturbeskrivning (rad 114-125):

```typescript
// FÖRE:
// - assumptions: Lista med "Arbete som ingår"

// EFTER:
// - assumptions: Tidsplan - planerade arbetsmoment och tidsramar (t.ex. "Vecka 1: Rivning", "2 veckor totalt")
```

Lägg till explicita instruktioner för tidsplan-tolkning:

```typescript
TIDSPLAN (assumptions):
- När användaren nämner "tidsplan", "tidplan", "veckor", "dagar", "arbetsmoment i ordning", 
  så ska detta gå till assumptions-arrayen
- Exempel: "Tidsplan två veckor" → assumptions: ["Totalt 2 veckor"]
- Exempel: "Vecka ett rivning, vecka två bygge" → assumptions: ["Vecka 1: Rivning", "Vecka 2: Bygge"]
- Varje punkt i tidsplanen ska vara ett separat element i arrayen
```

Uppdatera användarpromptens etiketter (rad 284):

```typescript
// FÖRE:
// Arbete som ingår:
// ${currentData.assumptions...}

// EFTER:
// Tidsplan:
// ${currentData.assumptions...}
```

#### 2. generate-estimate/index.ts

Uppdatera JSON-exemplen (rad 170-172 och 218-220):

```typescript
// FÖRE:
"assumptions": ["Antaganden baserade på mallen"],

// EFTER:
"assumptions": ["Vecka 1: Förberedelse och rivning", "Vecka 2: Byggnation"],
// eller för fallback:
"assumptions": ["Uppskattad tid: X veckor", "Moment 1 först, sedan moment 2"],
```

#### 3. apply-summary-voice-edits/index.ts

Uppdatera terminologin i prompten (rad 85 och 94):

```typescript
// FÖRE:
"assumptions": ["array", "med", "antaganden"],
// - Antaganden: ${JSON.stringify(currentData.assumptions)}

// EFTER:
"assumptions": ["Vecka 1: Moment A", "Vecka 2: Moment B"],
// - Tidsplan: ${JSON.stringify(currentData.assumptions)}
```

### Exempelscenario efter fix

**Röstkommando**: "Byte av fasad. Tidsplan: två veckor."

**Förväntat resultat**:
- **Projektbeskrivning (scope)**: "Byte av fasad"
- **Tidsplan (assumptions)**: ["2 veckor"]

### Filer som påverkas

1. `supabase/functions/apply-full-estimate-voice/index.ts`
2. `supabase/functions/generate-estimate/index.ts`
3. `supabase/functions/apply-summary-voice-edits/index.ts`

### Fördelar

- AI:n förstår nu att "Tidsplan" mappas till rätt fält
- Röstkommandon som "tidsplan två veckor" fungerar korrekt
- Konsekvent terminologi mellan UI och AI-prompter

