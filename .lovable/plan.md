

## AI-användningslogg med admin-popup

### Syfte
Skapa ett system som loggar varje AI-anrop per användare i databasen, och visa datan i en popup-dialog som bara syns for admin-kontot (mahad@datavoxx.se). En knapp pa dashboarden oppnar popupen.

### Steg 1: Ny databastabell `ai_usage_logs`

Skapar en tabell som loggar varje AI-anrop:

```text
ai_usage_logs
  - id: uuid (PK, default gen_random_uuid())
  - user_id: uuid (not null)
  - function_name: text (not null) -- t.ex. "global-assistant", "generate-estimate"
  - model: text -- vilken AI-modell
  - created_at: timestamptz (default now())
```

RLS-policyer:
- SELECT: Admins (via has_role) kan lasa alla rader. Vanliga anvandare kan lasa sina egna.
- INSERT: Ingen RLS-begransning for service_role (edge functions skriver via service role).

### Steg 2: Uppdatera 14 edge functions

Varje edge function som gor AI-anrop far en extra rad som loggar anropet till `ai_usage_logs` via service role client. Funktioner:

- `global-assistant`
- `agent-chat`
- `generate-estimate`
- `generate-report`
- `generate-plan`
- `transcribe-audio`
- `extract-vendor-invoice`
- `prefill-inspection`
- `apply-voice-edits`
- `apply-estimate-voice-edits`
- `apply-full-estimate-voice`
- `apply-summary-voice-edits`
- `parse-template-voice`
- `extract-form-data`

Loggningsrad som laggs till i varje funktion:

```text
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
await serviceClient.from('ai_usage_logs').insert({
  user_id: <authenticated user id>,
  function_name: '<function-name>',
  model: '<model used>'
});
```

### Steg 3: Admin-knapp + popup pa Dashboard

**Ny komponent: `src/components/dashboard/AIUsageDialog.tsx`**

En Dialog-komponent som visar:
- Totalt antal AI-anrop (senaste 30 dagarna)
- Anrop per anvandare (grupperat, med namn fran profiles)
- Anrop per funktion (vilka AI-funktioner anvands mest)
- Enkel tabell med oversikt

**Andring i `src/pages/Dashboard.tsx`:**
- Hamta inloggad anvandares email
- Om email === "mahad@datavoxx.se", visa en "AI-anvandning"-knapp i hero-sektionen
- Knappen oppnar AIUsageDialog

### Filer som skapas/andras

| Fil | Andring |
|-----|---------|
| Migration | Skapar `ai_usage_logs`-tabellen + RLS |
| 14 edge functions | Lagger till logging-rad efter AI-anrop |
| `src/components/dashboard/AIUsageDialog.tsx` | Ny komponent - popup med AI-data |
| `src/pages/Dashboard.tsx` | Admin-knapp som oppnar popupen |

### Teknisk detalj

```text
Dashboard.tsx:
  - Kollar om inloggad user.email === "mahad@datavoxx.se"
  - Visar knapp med BarChart3-ikon "AI-anvandning"
  - onClick -> oppnar AIUsageDialog

AIUsageDialog.tsx:
  - useQuery hamtar ai_usage_logs (senaste 30 dagar)
  - useQuery hamtar profiles for att matcha user_id -> namn
  - Visar:
    1. Totalt antal anrop
    2. Tabell: Anvandare | Antal anrop | Senaste anrop
    3. Tabell: Funktion | Antal anrop
  - Stangningsknapp
```

