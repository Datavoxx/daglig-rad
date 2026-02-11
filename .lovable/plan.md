

## Fix: Chatt-feedback poppar upp igen efter avvisning

### Orsak

Det finns **tva** chatt-feedbacksystem som kan triggas for samma konversation:

1. **FeedbackSection** (inline i chatten) -- visas direkt efter en avklarad uppgift, sparar feedback med task_type t.ex. "add_estimate_items"
2. **GlobalFeedbackPopup** -- visas 30 sekunder efter att man lamnar chatten, men letar bara efter task_type = "conversation_feedback" i databasen

Nar anvandaren ger feedback via FeedbackSection (inline) och sedan lamnar chatten, hittar GlobalFeedbackPopup ingen befintlig feedback (fel task_type-sokning) och visar popupen anda.

Dessutom: om anvandaren hoppar over popupen sparas inget i databasen, sa om location.pathname andras (navigation) kan timern aterstallas och popupen dyka upp igen.

### Losning

**1. `src/contexts/ConversationFeedbackContext.tsx`**
- Andra `checkExistingFeedback` att kontrollera ALL feedback for konversationen (ta bort `.eq("task_type", "conversation_feedback")`-filtret), sa att inline-feedback ocksa rakas
- Lagg till en `dismissedRef` som satts till `true` nar popupen stangs, sa att den inte kan oppnas igen under samma session/konversation
- Ta bort `location.pathname` fran useEffect-beroendelistan -- starta bara timern nar `lastConversationId` satts, inte vid varje sidnavigation

**2. `src/components/global-assistant/GlobalFeedbackPopup.tsx`**
- Inga forandringar behovs i sjalva komponenten

### Teknisk detalj

```text
Fore:
  checkExistingFeedback -> .eq("task_type", "conversation_feedback")
  useEffect deps: [lastConversationId, location.pathname]

Efter:
  checkExistingFeedback -> bara .eq("conversation_id", conversationId)
  useEffect deps: [lastConversationId]
  + dismissedRef forhindrar att popupen visas igen efter avvisning
```

### Forvanted beteende
- Om anvandaren redan gett feedback inline (FeedbackSection) visas ingen popup
- Om anvandaren hoppar over popupen visas den inte igen for samma konversation
- Navigering mellan sidor aterstartar inte 30-sekunderstimern

