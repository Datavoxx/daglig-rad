

## Rollval vid skapande av anställd (Admin / Arbetare)

### Vad ändras

En ny dropdown laggs till i formularet for anstallda dar man valjer om personen ska vara **Admin** (full atkomst, samma som dig) eller **Arbetare** (begransad atkomst).

### Hur det fungerar

- **Admin**: Personen far tillgang till alla moduler (dashboard, projekt, offerter, kunder, fakturor, etc.) -- precis som du sjalv.
- **Arbetare**: Personen far begransad tillgang (narvaro, tidsrapportering, dagrapporter) -- som idag.

### Tekniska andringar

| Fil | Andring |
|-----|---------|
| `employees`-tabellen (migration) | Lagg till kolumn `employee_role` (text, default `'worker'`) |
| `src/components/settings/EmployeeManager.tsx` | Lagg till en Select-dropdown for "Roll" med alternativen "Admin" och "Arbetare". Spara valet i `employee_role`-kolumnen. Visa rollen som badge pa varje anstalldsrad. |
| `src/components/settings/EmployeeManager.tsx` | Skicka med `employeeRole` i anropet till `send-employee-invitation` |
| `supabase/functions/send-employee-invitation/index.ts` | Ta emot `employeeRole` fran request body och spara det i `employee_invitations`-tabellen |
| `employee_invitations`-tabellen (migration) | Lagg till kolumn `employee_role` (text, default `'worker'`) |
| `supabase/functions/accept-invitation/index.ts` | Las av `employee_role` fran inbjudan. Om `'admin'`: satt roll till `'admin'` och ge ALL_MODULES. Om `'worker'`: behall nuvarande logik (roll `'user'`, begransade moduler). |
| `src/hooks/useUserPermissions.ts` | Ingen andring behovs -- admins far redan full atkomst via befintlig logik. |

### Flodet steg for steg

1. Du skapar en anstalld och valjer "Admin" eller "Arbetare"
2. Valet sparas i `employees.employee_role`
3. Nar inbjudan skickas foljer rollvalet med till `employee_invitations.employee_role`
4. Nar personen accepterar inbjudan satts ratt roll (`admin` eller `user`) och ratt modulbehorigher automatiskt

### Sakerhetsaspekter

- Rollvalet sker server-side i `accept-invitation`-funktionen, inte pa klienten
- Bara agaren av anstallda-posten kan andra rollvalet (skyddat av RLS)
- En admin-anstald far samma atkomst som organisationens agare till alla moduler

