

## Inbjudningslank direkt efter "Lagg till" -- utan e-post

### Vad andras

Hela e-postflödet tas bort. Istallet visas en inbjudningslank direkt i gransnittet efter att du klickar "Lagg till". Du kopierar lanken och skickar den sjalv (SMS, WhatsApp, etc.).

### Flodet steg for steg

1. Du fyller i namn, telefon, e-post, personnummer, anstallningsnummer och valjer roll (Admin/Arbetare)
2. Du klickar "Lagg till"
3. Anstallden sparas i databasen
4. Systemet skapar automatiskt en inbjudan med en unik token i `employee_invitations`-tabellen
5. En dialog visas med inbjudningslanken (t.ex. `https://daglig-rad.lovable.app/accept-invitation?token=abc123...`)
6. Du kopierar lanken med en "Kopiera"-knapp
7. Du skickar lanken till den anstallda via valfri kanal
8. Mottagaren klickar pa lanken, skapar ett losenord, och kontot aktiveras (detta flode finns redan via `AcceptInvitation`-sidan)

### Tekniska andringar

| Fil | Andring |
|-----|---------|
| `supabase/functions/send-employee-invitation/index.ts` | Ta bort all Resend/e-post-logik. Funktionen skapar bara inbjudan i databasen och returnerar `inviteUrl`. Tar bort beroendet pa `RESEND_API_KEY`. |
| `src/components/settings/EmployeeManager.tsx` | 1. Efter lyckat "Lagg till" (saveMutation), anropa edge-funktionen direkt for att skapa inbjudan och fa tillbaka lanken. 2. Visa en ny dialog med lanken och en "Kopiera"-knapp. 3. Ta bort den separata "Skicka inbjudan"-knappen (Send-ikonen) fran anstalldsraderna. |

### Detaljerad logik

**Edge-funktionen (forenklad):**
- Tar emot `employeeId`, `employeeEmail`, `employeeName`, `employeeRole`, `organizationName`, `baseUrl`
- Genererar token, sparar i `employee_invitations`
- Uppdaterar `employees.invitation_status` till `"pending"`
- Returnerar `{ inviteUrl: "https://daglig-rad.lovable.app/accept-invitation?token=..." }`
- Ingen Resend-import, ingen e-post

**EmployeeManager (UI-andringar):**
- `saveMutation.onSuccess`: Nar en ny anstalld skapas (inte redigering), anropa edge-funktionen och visa inbjudningsdialogen med lanken
- Ny state: `inviteLinkDialogOpen` och `inviteLink`
- Ny dialog som visar lanken med ett inputfalt (readonly) och en "Kopiera lank"-knapp
- Ta bort `inviteMutation`, `handleInvite` och Send-knappen fran varje anstalldsrad
- Behall badges for status (Aktiv, Inbjudan skickad, Ej inbjuden) men byt "Inbjudan skickad" till "Inbjudan skapad"

### Befintligt acceptera-flode

Sidan `AcceptInvitation` och edge-funktionerna `validate-invitation` och `accept-invitation` finns redan och fungerar. Mottagaren anger ett losenord, kontot skapas, och ratt roll/behörigheter satts beroende pa om det ar admin eller arbetare.

