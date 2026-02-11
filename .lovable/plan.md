

## Lägg till "Förbli inloggad"-knapp i utloggningsformuläret

### Vad som ändras
När man trycker "Logga ut" visas idag en feedback-popup med "Hoppa över" och "Skicka". En ny knapp "Förbli inloggad" läggs till som avbryter utloggningen helt och stänger popupen utan att logga ut användaren.

### Fil som ändras

**1. `src/components/layout/SessionFeedbackPopup.tsx`**
- Lägg till en ny callback-prop `onStayLoggedIn` (valfri, visas bara vid `trigger === "logout"`)
- Rendera en "Förbli inloggad"-knapp under de befintliga knapparna, bara vid utloggning (inte vid inaktivitet)
- Knappen stänger popupen utan att logga ut

**2. `src/components/layout/AppLayout.tsx`**
- Skicka en ny `onStayLoggedIn`-callback till `SessionFeedbackPopup` som bara stänger popupen (sätter `showSessionFeedback = false`) utan att anropa `signOut`

### Teknisk detalj

```text
SessionFeedbackPopup:
  + prop: onStayLoggedIn?: () => void
  + knapp: "Förbli inloggad" (visas bara om trigger === "logout" och onStayLoggedIn finns)
  + onClick -> anropar onStayLoggedIn

AppLayout:
  + handleStayLoggedIn = () => setShowSessionFeedback(false)
  + skickar onStayLoggedIn={handleStayLoggedIn} till SessionFeedbackPopup
```

### Knappordning i popupen (vid utloggning)
1. "Hoppa över" + "Skicka" (befintliga, skickar/hoppar feedback och loggar sedan ut)
2. "Förbli inloggad" (ny, avbryter utloggning, stänger popupen)
