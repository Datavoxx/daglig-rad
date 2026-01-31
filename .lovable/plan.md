# Organisations- och Tidsrapporteringssystem

## ✅ Steg 1 - Grunden (KLART)

1. ✅ Organisationsnamn tillagt i company_settings
2. ✅ EmployeeManager förenklad (roll/timpris borttagen från UI)
3. ✅ Ny tabell billing_types för debiteringstyper
4. ✅ Ny komponent BillingTypeManager

---

## ✅ Steg 2 - Inbjudningssystem (KLART)

### Implementerat:

1. ✅ **RESEND_API_KEY** sparad som hemlighet
2. ✅ **Databas:**
   - Ny tabell `employee_invitations` för att lagra tokens
   - Nya kolumner i `employees`: `linked_user_id`, `invitation_status`
3. ✅ **Edge functions:**
   - `send-employee-invitation` - Skickar branded e-post via Resend
   - `validate-invitation` - Validerar token
   - `accept-invitation` - Skapar konto och aktiverar anställd
4. ✅ **EmployeeManager:**
   - Bjud in-knapp (✉️) för varje anställd med e-post
   - Status-badge: "Ej inbjuden" / "Inbjudan skickad" / "Aktiv"
5. ✅ **AcceptInvitation.tsx:**
   - Ny sida på `/accept-invitation`
   - Validerar token och visar lösenordsformulär
   - Skapar konto och omdirigerar till inloggning

### E-post design:
- Byggio-logga (grön #22c55e)
- Svensk text
- "Aktivera mitt konto"-knapp

---

## 🔜 Steg 3 - Tidsrapportering (KOMMANDE)

### Planerat:

1. **Separat vy för anställda** (`/staff/tidsrapport`)
   - Enkel tidsrapportering per dag
   - Koppling till debiteringstyper
   - Endast tillgång till egna projekt

2. **Roll-baserad routing:**
   - Admin (ägare) → Fullständig åtkomst
   - Anställd → Begränsad vy

3. **Databas:**
   - Ny tabell `time_entries` för tidsregistreringar
   - Koppling: employee → billing_type → project

4. **Komponenter:**
   - `StaffTimesheet.tsx` - Huvudvy för anställda
   - `TimeEntryForm.tsx` - Formulär för att rapportera tid
   - `StaffLayout.tsx` - Separat layout utan admin-meny
