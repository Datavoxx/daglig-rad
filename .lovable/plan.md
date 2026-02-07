

# Plan: Fixa kundvisning vid val i verifikationskort

## Problem

| Vad som händer nu | Förväntat beteende |
|-------------------|-------------------|
| Klickar på kund → "Ja, det är Mahad" → AI svarar konstigt | Klickar på kund → Visar kundens fullständiga info direkt |
| Prompten säger "kundens namn, stad eller e-post" | Ska bara be om "kundens namn" |

## Rotorsak

1. **Prompten instruerar inte AI:n** att direkt använda `get_customer` när en kund bekräftas
2. **Meddelandet "Ja, det är X"** ger AI:n fritt spelrum att svara vad som helst
3. AI:n försöker tolka bekräftelsen och fortsätter med nästa steg (t.ex. offert) istället för att visa kundinformationen

## Lösning

### Alternativ A: Skicka strukturerat kommando istället för fritext

Ändra så att frontend skickar ett tydligt kommando med ID:t istället för "Ja, det är Mahad":

```typescript
// FÖRE (GlobalAssistant.tsx rad 147):
await sendMessage(`Ja, det är ${match.title}`, newContext);

// EFTER:
await sendMessage(`[SELECT_CUSTOMER:${match.id}] ${match.title}`, newContext);
```

Uppdatera sedan edge-funktionens prompt för att hantera detta:

```typescript
// I system-prompten:
Om meddelandet börjar med [SELECT_CUSTOMER:uuid], anropa DIREKT get_customer med det ID:t.
Visa sedan kundens fullständiga information.
```

### Alternativ B: (Bättre) Anropa API direkt från frontend

Istället för att skicka ett meddelande och låta AI tolka det, kan vi anropa `get_customer` direkt från frontend när användaren klickar:

```typescript
// handleVerificationSelect för "customer":
// 1. Anropa edge function med action: "get_customer" och customer_id
// 2. Visa resultatet direkt som ett nytt meddelande
```

### Alternativ C: (Rekommenderat) Förbättra prompten + kontextmedvetenhet

Uppdatera edge-funktionens system-prompt:

```text
NÄR ANVÄNDAREN BEKRÄFTAR VAL:
- Om context.selectedCustomerId finns och användaren bekräftar ("Ja", "det är X"):
  → Anropa OMEDELBART get_customer med selectedCustomerId
- Visa alltid fullständig information efter bekräftelse
```

## Teknisk implementation (Alternativ C)

### Fil 1: `supabase/functions/global-assistant/index.ts`

#### Ändring 1: Uppdatera prompt-texten (rad ~1779-1812)

```typescript
// FÖRE:
`Innan jag kan skapa en offert, behöver jag veta vilken kund offerten ska skapas för. Har du en befintlig kund, eller ska jag skapa en ny? Om befintlig, vänligen ange **kundens namn, stad eller e-post**.`

// EFTER (sök efter denna text i filen och ändra):
`Innan jag kan skapa en offert, behöver jag veta vilken kund offerten ska skapas för. Har du en befintlig kund, eller ska jag skapa en ny? Om befintlig, vänligen ange **kundens namn**.`
```

#### Ändring 2: Lägg till regel i system-prompten (rad ~1790-1812)

```typescript
// LÄGG TILL i system-prompten:
HANTERING AV BEKRÄFTELSER:
- När användaren bekräftar ett val (säger "ja", "det är X", "korrekt", "rätt"):
  - Om context.selectedCustomerId finns → anropa get_customer med det ID:t
  - Om context.selectedProjectId finns → anropa get_project med det ID:t  
  - Om context.selectedEstimateId finns → anropa get_estimate med det ID:t
- Visa ALLTID fullständig information efter bekräftelse, inte bara "OK"
```

### Fil 2: `src/pages/GlobalAssistant.tsx`

#### Ändring: Skicka tydligare meddelande (rad 147)

```typescript
// FÖRE:
await sendMessage(`Ja, det är ${match.title}`, newContext);

// EFTER:
await sendMessage(`Visa information om ${match.title}`, newContext);
```

## Förväntad flödesförbättring

```text
┌─────────────────────────────────────────────────────────┐
│ FÖRE:                                                   │
│ 1. Användare klickar på "Mahad"                        │
│ 2. Skickar "Ja, det är Mahad"                          │
│ 3. AI svarar konstigt eller frågar igen                │
│                                                         │
│ EFTER:                                                  │
│ 1. Användare klickar på "Mahad"                        │
│ 2. Skickar "Visa information om Mahad"                 │
│    + context: { selectedCustomerId: "uuid-123" }       │
│ 3. AI anropar get_customer("uuid-123")                 │
│ 4. Visar: Mahad, email, telefon, adress, projekt, etc. │
└─────────────────────────────────────────────────────────┘
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Uppdatera system-prompt med bekräftelsehantering + ändra "namn, stad eller e-post" till bara "namn" |
| `src/pages/GlobalAssistant.tsx` | Ändra bekräftelsemeddelandet till "Visa information om X" |

## Sammanfattning

Den viktigaste ändringen är att **ändra meddelandet som skickas vid val** från "Ja, det är X" till "Visa information om X", samt ge AI:n tydligare instruktioner i prompten om att använda `get_customer` direkt när ett ID finns i kontexten.

