# Plan: Feedback-funktionalitet

## Status: ✅ Implementerat

---

## Genomförda ändringar

### 1. Databastabell `ai_feedback`
- Skapad med RLS-policies för INSERT och SELECT
- Fält: `id`, `user_id`, `conversation_id`, `task_type`, `rating`, `comment`, `created_at`
- Valideringstrigger för rating (1-5)

### 2. Ny komponent `FeedbackSection.tsx`
- Tvåstegsflöde: stjärnbetyg → textkommentar
- Anpassad fråga baserad på betyg (4-5: "bra?", 1-3: "mindre bra?")
- Hoppa över-funktion i båda stegen
- Sparar till databasen

### 3. Uppdaterade typer
- `showFeedback?: boolean` och `taskType?: string` i `MessageData`

### 4. Uppdaterad `ResultCard.tsx`
- Integrerar `FeedbackSection` när `showFeedback === true`
- Tar emot `conversationId` för att länka feedback

### 5. Uppdaterad edge-funktion `global-assistant`
- Lagt till `showFeedback: true` och `taskType` för:
  - `add_estimate_items`
  - `create_daily_report`
  - `register_time`
  - `create_customer`
  - `create_project`
  - `create_work_order`
  - `check_in`
  - `check_out`

### 6. Borttagen "Sök kund" från `QuickSuggestions.tsx`

---

## Resultat

✓ Feedback visas endast efter helt slutförda uppgifter
✓ Tvåstegsflöde med dynamisk fråga
✓ Data sparas för analys
✓ "Sök kund"-knappen är borttagen

