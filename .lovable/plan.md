

## Personalliggare för anställda - QR-scan med inloggning

### Problemanalys

1. **404-fel på scan-länken**: Du besökte `https://datavoxx.se/attendance/scan/...` men QR-koden genereras med `https://daglig-rad.lovable.app`. Om din egen domän (datavoxx.se) ska användas måste QR-koden peka dit istället.

2. **Nuvarande personalliggare visar admin-vy för alla**: Det finns ingen skillnad mellan admin och anställd.

3. **Anställda har inte tillgång till arbetsgivarens projekt**: RLS-policyer begränsar projekt till `user_id = auth.uid()`, vilket gör att anställda bara ser sina egna projekt (som de inte har några av).

---

### Vad som ska byggas

#### 1. QR-kod pekar på egen domän

Ändra QR-kod-genereringen att använda `https://datavoxx.se` istället för `https://daglig-rad.lovable.app`.

#### 2. QR-scan kräver inloggning

När någon öppnar scan-länken utan att vara inloggad:
- Visa projekt-info och en "Logga in"-knapp
- Efter inloggning: Redirect tillbaka till scan-sidan med rätt projekt
- Ta bort "gäst-mode" (ange namn manuellt)

#### 3. Förenklad Personalliggare för anställda

Skapa en ny vy för anställda som endast visar:
- Projektval (dropdown)
- Stor "Checka in"-knapp
- Efter incheckning: status + "Checka ut"-knapp

**Ingen** QR-generator, historik eller "På plats just nu" (det är admin-funktioner).

#### 4. Anställda kan se arbetsgivarens projekt

Uppdatera RLS-policyer på `projects` så att anställda kan se och redigera projekt som tillhör deras arbetsgivare.

**Ny logik:**
- Hämta `employer_id` från `employees.linked_user_id` → hitta vilken `employees.user_id` (arbetsgivaren)
- Om användaren är länkad som anställd → ge tillgång till arbetsgivarens projekt

---

### Teknisk implementation

#### Databas: RLS-policy för projekt

Skapa en säker funktion för att kontrollera om en användare är anställd hos en specifik ägare:

```sql
-- Funktion: Kontrollera om användare är anställd
CREATE OR REPLACE FUNCTION public.get_employer_id(employee_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.user_id 
  FROM public.employees e 
  WHERE e.linked_user_id = employee_user_id 
    AND e.is_active = true
  LIMIT 1
$$;

-- Ny RLS-policy: Anställda kan se arbetsgivarens projekt
CREATE POLICY "Employees can view employer projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id = public.get_employer_id(auth.uid())
  );

-- Ny RLS-policy: Anställda kan redigera arbetsgivarens projekt
CREATE POLICY "Employees can update employer projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id = public.get_employer_id(auth.uid())
  );

-- Samma för INSERT och DELETE
```

#### Frontend: Ny scan-sida med login-redirect

Uppdatera `AttendanceScan.tsx`:

1. Om ej inloggad → Visa projektinfo + "Logga in"-knapp
2. "Logga in"-knappen skickar med `returnTo=/attendance/scan/{projectId}/{token}` som query-param
3. Auth-sidan läser `returnTo` och redirectar dit efter inloggning
4. Ta bort gäst-mode (input för namn)

#### Frontend: Förenklad vy för anställda

Skapa `AttendanceEmployee.tsx` som endast visar:
- Välj projekt (dropdown)
- Stor "Checka in"-knapp (grön)
- Status om incheckad + "Checka ut"-knapp (röd)

Admin-vyn (`Attendance.tsx`) visar det fullständiga gränssnittet.

#### Routing-logik

I `Attendance.tsx`:
- Om användaren är admin (har `settings` i moduler) → Visa full admin-vy
- Om användaren är anställd (endast `dashboard`, `projects`, `time-reporting`) → Visa förenklad vy

---

### Filer som skapas/ändras

| Fil | Ändring |
|-----|---------|
| `src/components/attendance/QRCodeGenerator.tsx` | Ändra URL till `https://datavoxx.se` |
| `src/pages/AttendanceScan.tsx` | Ta bort gäst-mode, lägg till login-redirect |
| `src/pages/Auth.tsx` | Hantera `returnTo` query-param |
| `src/pages/Attendance.tsx` | Visa förenklad vy för anställda |
| `supabase/migrations/...` | Ny RLS-policy + `get_employer_id`-funktion |
| `supabase/functions/accept-invitation/index.ts` | Lägg till `attendance` i anställdas moduler |

---

### Användarflöde efter implementation

**Anställd scannar QR-kod:**
```text
1. Öppnar https://datavoxx.se/attendance/scan/{projectId}/{token}
2. Ser projekt-info + "Logga in"-knapp
3. Klickar "Logga in" → Kommer till /auth
4. Loggar in → Redirectas tillbaka till scan-sidan
5. Ser "Checka in"-knapp → Klickar
6. Bekräftelse: "Incheckad på Villan!"
```

**Anställd loggar in direkt (utan QR):**
```text
1. Går till /auth → Loggar in
2. Redirectas till /dashboard
3. Klickar på "Personalliggare" i menyn
4. Ser förenklad vy: Välj projekt + Checka in-knapp
```

**Admin loggar in:**
```text
1. Loggar in → Dashboard
2. Går till Personalliggare
3. Ser full admin-vy: QR-kod, historik, "På plats just nu"
```

---

### Sammanfattning

| Funktion | För admin | För anställd |
|----------|-----------|--------------|
| Checka in/ut | ✅ | ✅ |
| Välj projekt | ✅ | ✅ |
| Se alla arbetsgivarens projekt | ✅ (egna) | ✅ (arbetsgivarens) |
| QR-kod generator | ✅ | ❌ |
| "På plats just nu" | ✅ | ❌ |
| Historik + export | ✅ | ❌ |

