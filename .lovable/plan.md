

## Mål

1. **Lägga till feedback-funktionalitet** efter att en uppgift är helt slutförd i Byggio AI
2. **Ta bort "Sök kund"-knappen** från snabbförslagen

---

## Feedback-design

### Tvåstegsflöde

**Steg 1: Stjärnbetyg (1-5)**
```text
┌─────────────────────────────────────────────────────────┐
│ ✓ Offert OFF-2026-0042 uppdaterad med 1 poster!         │
│                                                         │
│   [Öppna offert]                                        │
│                                                         │
│ ────────────────────────────────────────────────────── │
│                                                         │
│   Hur nöjd är du med AI-assistenten?                   │
│                                                         │
│   ☆  ☆  ☆  ☆  ☆                                       │
│   1  2  3  4  5                                         │
│                                                         │
│                                      [Hoppa över]       │
└─────────────────────────────────────────────────────────┘
```

**Steg 2: Textkommentar (efter val av stjärnor)**
- Om **4-5 stjärnor**: "Vad var det du tyckte var så bra?"
- Om **1-3 stjärnor**: "Vad tyckte du var så mindre bra?"

```text
┌─────────────────────────────────────────────────────────┐
│   Tack! ★★★★★                                          │
│                                                         │
│   Vad var det du tyckte var så bra?                    │
│                                                         │
│   ┌───────────────────────────────────────────────┐    │
│   │                                               │    │
│   │                                               │    │
│   └───────────────────────────────────────────────┘    │
│                                                         │
│                        [Skicka]  [Hoppa över]          │
└─────────────────────────────────────────────────────────┘
```

---

## Vilka resultattyper ska visa feedback?

| Resultattyp | Visa feedback? | Motivering |
|-------------|----------------|------------|
| `create_estimate` | ❌ Nej | Följs direkt av "lägg till offertposter" |
| `add_estimate_items` | ✅ Ja | Offertarbetet är klart |
| `create_daily_report` | ✅ Ja | Rapporten är skapad |
| `register_time` | ✅ Ja | Tidsregistreringen är klar |
| `create_customer` | ✅ Ja | Kunden är skapad |
| `create_project` | ✅ Ja | Projektet är skapat |
| `create_work_order` | ✅ Ja | Arbetsordern är skapad |
| `check_in_complete` | ✅ Ja | Incheckningen är klar |
| `check_out_complete` | ✅ Ja | Utcheckningen är klar |

---

## Teknisk implementation

### 1. Skapa ny databastabell `ai_feedback`

```sql
CREATE TABLE public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.assistant_conversations(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,  -- t.ex. "add_estimate_items", "create_daily_report"
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS-policy
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON public.ai_feedback FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. Skapa ny komponent `FeedbackSection.tsx`

**Placering:** `src/components/global-assistant/FeedbackSection.tsx`

```typescript
interface FeedbackSectionProps {
  taskType: string;           // "add_estimate_items", "create_daily_report", etc.
  conversationId?: string;
  onComplete?: () => void;
}
```

**Funktionalitet:**
- State för `step`: "rating" | "comment" | "complete"
- State för `rating`: number (1-5)
- State för `comment`: string
- Sparar till databasen via Supabase
- Visar "Tack för din feedback!" när klart

### 3. Uppdatera `ResultCard.tsx`

Lägg till prop för att visa feedback:

```typescript
interface ResultCardProps {
  data: MessageData;
  content?: string;
  onNextAction?: (action: NextAction) => void;
  showFeedback?: boolean;       // NY
  taskType?: string;            // NY
  conversationId?: string;      // NY
}
```

Inkludera `FeedbackSection` i kortets botten när `showFeedback === true`.

### 4. Uppdatera `MessageData` i types

Lägg till ny flagga:

```typescript
interface MessageData {
  // ... befintliga fält
  showFeedback?: boolean;  // NY: visar feedback-sektion
  taskType?: string;       // NY: identifierar uppgiftstypen
}
```

### 5. Uppdatera edge-funktionen (global-assistant)

För varje slutförd uppgift, lägg till `showFeedback: true` och `taskType`:

```typescript
case "add_estimate_items": {
  return {
    type: "result",
    content: "",
    data: {
      success: true,
      resultMessage: `Offert ${result.offer_number} uppdaterad...`,
      showFeedback: true,          // NY
      taskType: "add_estimate_items", // NY
      // ...
    },
  };
}
```

### 6. Ta bort "Sök kund" från QuickSuggestions

I `QuickSuggestions.tsx`, ta bort objektet:

```typescript
// TA BORT:
{
  label: "Sök kund",
  icon: Users,
  prompt: "Sök efter en kund",
},
```

---

## Sammanfattning av filer att ändra

| # | Fil | Ändring |
|---|-----|---------|
| 1 | **Databas** | Skapa tabell `ai_feedback` med RLS |
| 2 | `src/components/global-assistant/FeedbackSection.tsx` | **NY FIL** – Feedback UI-komponent |
| 3 | `src/types/global-assistant.ts` | Lägg till `showFeedback` och `taskType` i `MessageData` |
| 4 | `src/components/global-assistant/ResultCard.tsx` | Integrera `FeedbackSection` |
| 5 | `supabase/functions/global-assistant/index.ts` | Lägg till feedback-flaggor i slutförda uppgifter |
| 6 | `src/components/global-assistant/QuickSuggestions.tsx` | Ta bort "Sök kund" |

---

## Resultat

1. Feedback-ruta visas **endast** efter att uppgifter är helt slutförda
2. Tvåstegsflöde: Stjärnor först, sedan fråga baserad på betyget
3. Data sparas i `ai_feedback`-tabellen för analys
4. "Sök kund"-knappen är borttagen från snabbförslagen
5. Användaren kan hoppa över feedback om de vill

