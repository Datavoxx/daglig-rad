

## Mål

Lägg till användarens namn (`full_name` från profiles-tabellen) i webhook-payloaden som skickas när någon hoppar över feedback.

## Ändringar

### 1. `src/components/global-assistant/GlobalFeedbackPopup.tsx`

I `notifySkip`-funktionen: efter att ha hämtat användaren via `supabase.auth.getUser()`, hämta även `full_name` från `profiles`-tabellen och inkludera det i webhook-bodyn.

```typescript
const notifySkip = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    let fullName: string | null = null;
    if (data.user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .single();
      fullName = profile?.full_name || null;
    }
    await fetch("https://datavox.app.n8n.cloud/webhook/hoppaover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: data.user?.id || null,
        email: data.user?.email || null,
        full_name: fullName,
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

### 2. `src/components/global-assistant/FeedbackSection.tsx`

Samma ändring i dess `notifySkip`-funktion -- hämta `full_name` från profiles och lägg till i payloaden.

## Webhook-data efter ändring

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "Mahad Ali",
  "conversation_id": "uuid",
  "source": "global_feedback_popup | feedback_section",
  "skipped_at": "2026-02-11T12:00:00.000Z"
}
```

