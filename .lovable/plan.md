# Databasstyrd sidomeny (full kontroll)

Idag hårdkodar koden vilka moduler varje roll ser: admin/founder får alltid hela listan, anställda får en fast lista, och `user_permissions` används bara som fallback. Det gör det omöjligt att plocka bort t.ex. Personalliggare eller Löneexport från databasen.

Efter ändringen är `user_permissions.modules` enda sanningen för alla konton. Tar du bort `payroll-export` ur raden försvinner menyvalet, och sidan blir oåtkomlig.

## Vad som ändras

**1. Behörighetslogiken (`src/hooks/useUserPermissions.ts`)**
- Ta bort genvägen som ger founder/admin `ALL_MODULES`.
- Ta bort den fasta `EMPLOYEE_MODULES`-listan för anställda.
- Ta bort fallbacken "tom lista → ge allt" och "innehåller dashboard → ge allt".
- Läs alltid `user_permissions.modules` för inloggad användare och använd exakt den listan.
- `role` och `isEmployee` behålls (de styr vilken meny-variant och startsida som visas), men avgör inte längre åtkomst.
- `getDefaultRoute()` väljer första tillgängliga modul i praktisk ordning istället för att anta dashboard.

**2. Menyerna följer med automatiskt**
`AppLayout` och `BottomNav` filtrerar redan på `hasAccess(moduleKey)`, så inga listor behöver dupliceras. Två detaljer justeras:
- Anställdmenyns "Hem" och admin-menyns "JIA AI" har idag modulnycklar som inte matchar dem själva; de får egna nycklar (`dashboard` för JIA AI, `daily-reports` behålls för anställd-hem) så de kan stängas av separat.
- `Bokföring` och `Kvitton` delar nyckeln `invoices`. De får egna nycklar `accounting` respektive `receipts` så de kan plockas bort var för sig.

**3. Sidorna skyddas fortsatt**
`ProtectedModuleRoute` fungerar oförändrat men får en säkrare fallback: saknas modulen skickas användaren till första tillåtna sida, och har man inga moduler alls visas en enkel "Du saknar behörighet"-vy istället för en oändlig redirect.

**4. Databasen**
- Se till att varje befintligt konto har en rad i `user_permissions` med sina nuvarande moduler, så ingen tappar åtkomst vid övergången.
- Nya konton: `handle_new_user` ger fortsatt full modullista vid registrering, som du sedan kan trimma.
- Modulnycklarna dokumenteras så du vet exakt vad som går att ta bort.

## Modulnycklar du kan styra

`dashboard`, `projects`, `estimates`, `customers`, `invoices`, `accounting`, `receipts`, `time-reporting`, `attendance`, `daily-reports`, `payroll-export`, `docs`, `guide`, `settings`, `inspections`

Exempel: ta bort personalliggare och löneexport för ett konto genom att uppdatera raden i `user_permissions` så att `attendance` och `payroll-export` inte längre finns i `modules`.

## Viktigt att veta

Eftersom detta gäller alla konton, även admin och founder, kan du låsa ut dig själv från `Inställningar` om du tar bort `settings` ur din egen rad. Ändringen slår igenom vid nästa sidladdning.
