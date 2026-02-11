

## Sessionsfeedback vid utloggning och inaktivitet

### Vad som byggs

Ett feedback-formulär som dyker upp i två situationer:
1. **Innan utloggning** -- när användaren klickar "Logga ut" visas formuläret istället för att logga ut direkt
2. **Efter 30 minuters inaktivitet** -- formuläret visas automatiskt

Feedbacken skickas till `https://datavox.app.n8n.cloud/webhook/feedbacksession` och innehåller användarinfo, betyg och kommentarer.

### Ny fil: `src/components/layout/SessionFeedbackPopup.tsx`

En popup-komponent med:
- 5-stjärnig betygsättning
- Textfält: "Vad var bra?" och "Vad kan göras bättre?"
- Knappar: "Hoppa över" och "Skicka"
- Mörk overlay (samma stil som GlobalFeedbackPopup)
- Vid "Skicka" eller "Hoppa över": kör callback (utloggning eller stäng)

Webhook-payload:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "Namn",
  "rating": 4,
  "what_was_good": "Bra gränssnitt",
  "what_can_improve": "Snabbare laddning",
  "trigger": "logout | inactivity",
  "sent_at": "2026-02-11T12:00:00.000Z"
}
```

### Ny fil: `src/hooks/useInactivityTimer.ts`

En hook som:
- Lyssnar på `mousemove`, `keydown`, `click`, `scroll`, `touchstart`
- Återställer en 30-minuters timer vid varje aktivitet
- Anropar en callback när timern löper ut
- Bara aktiv för inloggade användare (inom skyddade routes)

### Ändrad fil: `src/components/layout/AppLayout.tsx`

1. Importera `SessionFeedbackPopup` och `useInactivityTimer`
2. Lägg till state: `showSessionFeedback` och `feedbackTrigger` ("logout" eller "inactivity")
3. Ersätt alla tre utloggningsknappar (desktop sidebar, desktop tooltip, mobil meny) -- istället för att direkt anropa `signOut`, sätt `showSessionFeedback = true` och `feedbackTrigger = "logout"`
4. Koppla `useInactivityTimer` med 30 min timeout som sätter `showSessionFeedback = true` och `feedbackTrigger = "inactivity"`
5. Rendera `SessionFeedbackPopup` med en `onComplete`-callback som:
   - Om trigger var "logout": kör `supabase.auth.signOut()` och navigera till `/auth`
   - Om trigger var "inactivity": stäng popupen och återställ timern

### Tekniska detaljer

- Inaktivitetstimern skapas med `setTimeout` (30 * 60 * 1000 ms)
- Event listeners läggs till på `window` och rensas vid unmount
- Timern pausas/rensas om popupen redan visas
- Webhook-anropet sker med `fetch` i en try/catch (fel loggas men blockerar inte utloggning)
- Användarinfo hämtas via `supabase.auth.getUser()` + profiles-tabellen (samma mönster som GlobalFeedbackPopup)

