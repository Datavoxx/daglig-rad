

## Plan: Steg 2 - Inbjudningssystem för Anställda via E-post

### Sammanfattning

Detta är **Steg 2** av organisationssystemet. Vi bygger nu:
1. Spara Resend API-nyckel som backend-hemlighet
2. Skapa edge function för att skicka inbjudningsmejl med Byggio-design
3. Lägg till "Bjud in"-knapp i anställda-hanteringen
4. Skapa en accepteringssida där anställda sätter lösenord och aktiverar sitt konto

---

### Del 1: Lägg till Resend API-nyckel

**Hemlighet som sparas:**
- `RESEND_API_KEY`: re_9UTXTGQ4_6XQicoL15jWBwmaMXXHqmotn

---

### Del 2: Ny databastabell för inbjudningar

**Ny tabell: `employee_invitations`**
```sql
CREATE TABLE employee_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  organization_name text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Ingen RLS krävs - tokens valideras av edge function
ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- Owner kan se sina inbjudningar
CREATE POLICY "Users can view own invitations"
  ON employee_invitations FOR SELECT USING (auth.uid() = invited_by);
CREATE POLICY "Users can insert own invitations"
  ON employee_invitations FOR INSERT WITH CHECK (auth.uid() = invited_by);
```

**Uppdatera employees-tabellen:**
```sql
-- Lägg till koppling till användar-konto (för framtida inloggning)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'not_invited';
-- Möjliga status: 'not_invited', 'pending', 'accepted'
```

---

### Del 3: Edge Function för inbjudningsmejl

**Ny fil: `supabase/functions/send-employee-invitation/index.ts`**

Skickar ett snyggt HTML-mejl med:
- Byggio-logga (länk till public logo eller inline base64)
- Organisationsnamn
- Inbjudningslänk med token
- Byggio grönt färgschema (#22c55e)
- Svensk text

**E-postinnehåll (HTML):**
```text
┌─────────────────────────────────────────────────────┐
│              [Byggio Logo]                          │
│                                                     │
│  Hej!                                               │
│                                                     │
│  Du har bjudits in till {Organisationsnamn} på      │
│  Byggio - verktyget för smarta byggföretag.         │
│                                                     │
│  Klicka på knappen nedan för att aktivera ditt      │
│  konto och skapa ett lösenord.                      │
│                                                     │
│           [ Aktivera mitt konto ]                   │
│                                                     │
│  Länken är giltig i 7 dagar.                        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Med vänliga hälsningar,                            │
│  Byggio-teamet                                      │
└─────────────────────────────────────────────────────┘
```

---

### Del 4: Uppdatera EmployeeManager med "Bjud in"-knapp

**Ändringar i EmployeeManager.tsx:**
- Lägg till en "Bjud in"-knapp (✉️ ikon) för varje anställd som har e-post
- Knappen är disabled om:
  - Anställd saknar e-post
  - Inbjudan redan skickad (pending)
  - Redan accepterat
- Visa status-badge: "Ej inbjuden" / "Inbjudan skickad" / "Aktiv"

**Visuellt:**
```
┌────────────────────────────────────────────────────────────────┐
│ Erik Svensson                                  [✉️] [✏️] [🗑️] │
│ 📞 070-123 45 67  ✉️ erik@exempel.se   ⬤ Inbjudan skickad     │
└────────────────────────────────────────────────────────────────┘
```

---

### Del 5: Ny sida för att acceptera inbjudan

**Ny fil: `src/pages/AcceptInvitation.tsx`**

En fristående sida (ingen autentisering krävs) där anställda:
1. Ser Byggio-logga och organisationsnamn
2. Bekräftar sin e-postadress (redan förifylld)
3. Skapar lösenord + bekräftar lösenord
4. Klickar "Aktivera konto"

**Flöde:**
```text
1. Anställd klickar länk i mejlet
   → /accept-invitation?token=abc123

2. Sidan validerar token via edge function

3. Om giltig: visa formulär för lösenord

4. Vid submit:
   - Skapa användarkonto i auth.users
   - Uppdatera employee.linked_user_id
   - Uppdatera invitation.accepted_at
   - Logga in automatiskt
   - Omdirigera till /staff/tidsrapport (framtida sida)
```

**Design - samma stil som Auth.tsx:**
```
┌─────────────────────────────────────────────────────┐
│              [Byggio Logo]                          │
│                                                     │
│  Välkommen till Byggmästar AB!                     │
│  Aktivera ditt konto för att börja rapportera tid  │
│                                                     │
│  E-POST (readonly)                                  │
│  [erik@exempel.se]                                  │
│                                                     │
│  LÖSENORD                                           │
│  [••••••••]                        👁                │
│                                                     │
│  BEKRÄFTA LÖSENORD                                  │
│  [••••••••]                        👁                │
│                                                     │
│  [      Aktivera mitt konto      ]                  │
└─────────────────────────────────────────────────────┘
```

---

### Del 6: Edge Function för att validera token

**Ny fil: `supabase/functions/validate-invitation/index.ts`**

GET-endpoint som:
- Tar emot `token` som query-param
- Returnerar `{ valid: true, email, organizationName }` eller `{ valid: false, error }`

---

### Del 7: Edge Function för att acceptera inbjudan

**Ny fil: `supabase/functions/accept-invitation/index.ts`**

POST-endpoint som:
- Skapar användarkonto via Supabase Admin API
- Uppdaterar `employee.linked_user_id`
- Markerar inbjudan som accepterad
- Returnerar session för auto-login

---

### Filöversikt

| Fil | Typ | Beskrivning |
|-----|-----|-------------|
| `employee_invitations` (DB) | Ny tabell | Lagrar inbjudningar med tokens |
| `employees` (DB) | Uppdatering | Lägg till `linked_user_id`, `invitation_status` |
| `send-employee-invitation/` | Edge function | Skickar inbjudningsmejl via Resend |
| `validate-invitation/` | Edge function | Validerar token och returnerar info |
| `accept-invitation/` | Edge function | Skapar konto och accepterar inbjudan |
| `EmployeeManager.tsx` | Uppdatering | Lägg till "Bjud in"-knapp och status |
| `AcceptInvitation.tsx` | Ny sida | Formulär för att sätta lösenord |
| `App.tsx` | Uppdatering | Lägg till route `/accept-invitation` |

---

### E-postdomän

**Viktigt:** För att skicka mejl via Resend måste du ha en verifierad domän. 

- Gå till https://resend.com/domains och lägg till din domän (t.ex. `datavoxx.se` eller `byggio.se`)
- Följ instruktionerna för att verifiera med DNS-records
- Uppdatera `from`-adressen i edge function till t.ex. `noreply@byggio.se`

---

### Teknisk sammanfattning

1. **Databas:** 1 ny tabell (`employee_invitations`), 2 nya kolumner i `employees`
2. **Edge functions:** 3 nya (`send-employee-invitation`, `validate-invitation`, `accept-invitation`)
3. **Nya komponenter:** `AcceptInvitation.tsx`
4. **Uppdaterade komponenter:** `EmployeeManager.tsx`, `App.tsx`
5. **Hemligheter:** RESEND_API_KEY läggs till

---

### Vad som kommer i Steg 3 (framtida)

- Separat tidsrapporteringsvy för anställda (`/staff/tidsrapport`)
- Roll-baserad routing (admin vs anställd)
- Koppling mellan tidsrapport och debiteringstyper

