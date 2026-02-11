

## Webhook-korrigering för chattfeedback

### Nuläge

Just nu skickar **båda** komponenterna (`FeedbackSection` och `GlobalFeedbackPopup`) till `https://datavox.app.n8n.cloud/webhook/feedback-chatt` enbart vid **hoppa över** -- men inget webhook-anrop görs vid faktisk inskickning av feedback (den sparas bara i databasen).

### Vad som ändras

| Åtgärd | Webhook |
|--------|---------|
| Hoppa över | `https://datavox.app.n8n.cloud/webhook/hoppaover` (återställs) |
| Skicka feedback | `https://datavox.app.n8n.cloud/webhook/feedback-chatt` (nytt) |

### Filer som ändras

**1. `src/components/global-assistant/FeedbackSection.tsx`**
- Ändra `notifySkip`-webhooken tillbaka till `/hoppaover`
- Lägg till ett POST-anrop till `/feedback-chatt` i `submitFeedback`-funktionen (efter lyckat databasinsert), med payload: user_id, email, full_name, conversation_id, task_type, rating, comment, sent_at

**2. `src/components/global-assistant/GlobalFeedbackPopup.tsx`**
- Ändra `notifySkip`-webhooken tillbaka till `/hoppaover`
- Lägg till ett POST-anrop till `/feedback-chatt` i `handleSubmit`-funktionen (efter lyckat databasinsert), med payload: user_id, email, full_name, conversation_id, rating, what_was_good, what_can_improve, sent_at

Alla webhook-anrop görs i try/catch så att eventuella fel inte blockerar det normala flödet.

