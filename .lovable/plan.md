
# Plan: Förbättra bokningsdialogen och fixa alla problem

## Problem att lösa

1. **Visuellt**: 30/60 min-korten syns inte ordentligt, tidsvalen är dolda
2. **Bokning fungerar inte**: CORS-fel när vi skickar till extern webhook från frontend
3. **Alla fält obligatoriska**: Säkerställ att allt måste fyllas i
4. **Post-booking registreringsprompt**: Visa "Har du ett konto? Registrera dig"-meddelande

---

## Lösningar

### 1. Skapa Edge Function för webhook-proxy

Eftersom webbläsaren blockerar direktanrop till externa webhooks (CORS), behöver vi en edge function som agerar mellanhand.

**Fil:** `supabase/functions/training-booking/index.ts`

```text
┌─────────────┐      ┌──────────────────┐      ┌───────────────────┐
│   Frontend  │ ───► │  Edge Function   │ ───► │  n8n Webhook      │
│   (Dialog)  │      │  /training-booking│      │  datavox.app...   │
└─────────────┘      └──────────────────┘      └───────────────────┘
```

- Tar emot bokningsdata från frontend
- Skickar vidare till `https://datavox.app.n8n.cloud/webhook/utbildning`
- Returnerar success/error till frontend

---

### 2. Förbättra visuell layout

**Ändringar i TrainingBookingDialog:**

| Problem | Lösning |
|---------|---------|
| 30/60 min kort för små | Öka padding, tydligare typografi |
| Tider dolda tills dag vald | Visa alltid tiderna (disabled om ingen dag) |
| Dialog för lång | Kompaktare spacing |

**Ny layout för duration-valen:**
- Tydligare bakgrundsfärg vid val
- Större text för "30 min" / "60 min"
- Bättre visuell feedback

---

### 3. Alla fält obligatoriska

Formuläret validerar redan namn, e-post, telefon via Zod. Men vi behöver:
- Visa tydligare att dag och tid är obligatoriska
- Knappen är redan disabled tills allt är valt

---

### 4. Post-booking registreringsprompt

Efter lyckad bokning, visa:

```text
┌──────────────────────────────────────────────────┐
│           ✓ Tack för din bokning!                │
│                                                  │
│   Vi ringer dig måndag 10 februari kl 10:00.     │
│                                                  │
│   ────────────────────────────────────────────   │
│                                                  │
│   Har du ett konto?                              │
│   Registrera dig innan samtalet för att          │
│   förbereda din Byggio-upplevelse.               │
│                                                  │
│         [ Registrera konto → ]                   │
│         [ Stäng ]                                │
└──────────────────────────────────────────────────┘
```

---

## Tekniska detaljer

### Edge Function (`training-booking/index.ts`)
- Tar emot POST med bokningsdata
- Validerar att alla fält finns
- Skickar vidare till n8n webhook
- Returnerar framgång/fel

### TrainingBookingDialog ändringar
- Byt från direkt webhook-anrop till edge function
- Förbättra layouten för 30/60 min-val
- Visa tidsvalen alltid (med disabled-state)
- Uppdatera success-skärmen med registreringsprompt
- Lägg till länk till `/register`

---

## Filer som ändras/skapas

| Fil | Ändring |
|-----|---------|
| `supabase/functions/training-booking/index.ts` | NY - Webhook proxy |
| `supabase/config.toml` | Lägg till training-booking function |
| `src/components/landing/TrainingBookingDialog.tsx` | Visuella förbättringar + edge function anrop + registreringsprompt |
