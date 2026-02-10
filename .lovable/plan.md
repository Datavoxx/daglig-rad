

## Mål

Trigga webhook `https://datavox.app.n8n.cloud/webhook/hoppaover` varje gång en användare hoppar över feedback-enkäten.

---

## Berörda ställen

Det finns "Hoppa över" på **två** ställen:

1. **GlobalFeedbackPopup** (den mörka popup:en som visas 30 sek efter man lämnar chatten)
   - "Hoppa över"-knappen (rad 179-187)
   - X-knappen uppe till höger (rad 114-120) — fungerar också som skip

2. **FeedbackSection** (inline-feedbacken i chatten)
   - "Hoppa över" i rating-steget (rad 113-121)
   - "Hoppa över" i kommentarssteget (rad 152-160)

---

## Teknisk implementation

### Fil: `src/components/global-assistant/GlobalFeedbackPopup.tsx`

Lägg till en `notifySkip`-funktion som anropar webhooken, och kalla den innan `onClose()` i både "Hoppa över"-knappen och X-knappen:

```tsx
const notifySkip = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    await fetch("https://datavox.app.n8n.cloud/webhook/hoppaover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: data.user?.id || null,
        email: data.user?.email || null,
        conversation_id: conversationId,
        source: "global_feedback_popup",
        skipped_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error("Skip webhook error:", e);
  }
};
```

Uppdatera:
- X-knappen: `onClick` kör `notifySkip()` sedan `onClose()`
- "Hoppa över"-knappen: `onClick` kör `notifySkip()` sedan `onClose()`

---

### Fil: `src/components/global-assistant/FeedbackSection.tsx`

Lägg till samma typ av `notifySkip`-funktion och anropa den i `handleSkip`:

```tsx
const notifySkip = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await fetch("https://datavox.app.n8n.cloud/webhook/hoppaover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id || null,
        email: user?.email || null,
        conversation_id: conversationId || null,
        task_type: taskType,
        source: "feedback_section",
        skipped_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error("Skip webhook error:", e);
  }
};

const handleSkip = () => {
  notifySkip(); // Fire-and-forget
  if (step === "rating") {
    setStep("complete");
    onComplete?.();
  } else {
    submitFeedback(true);
  }
};
```

---

## Sammanfattning

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `GlobalFeedbackPopup.tsx` | Lägg till `notifySkip` och anropa vid X-knapp + "Hoppa över" |
| 2 | `FeedbackSection.tsx` | Lägg till `notifySkip` och anropa i `handleSkip` |

---

## Data som skickas till webhooken

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "conversation_id": "uuid eller null",
  "source": "global_feedback_popup | feedback_section",
  "task_type": "bara för feedback_section",
  "skipped_at": "2026-02-10T12:00:00.000Z"
}
```

Webhook-anropet görs som fire-and-forget — det blockerar inte UI:t.
