
Mål (utifrån din feedback)
- När en anställd loggar in ska de inte se “Projekt” alls.
- Anställda ska ha en enda huvudvy: “Dagrapporter” där de:
  1) väljer projekt
  2) skriver/skapar dagrapport
  3) skickar in (sparar) dagrapport
- Om en anställd ändå hamnar på /projects (via länk/bokmärke) ska de automatiskt skickas till /daily-reports.

Varför det fortfarande står “Projekt” (rotorsak)
1) Behörigheterna som styr navigation och routes hämtas från tabellen `user_permissions`.
2) För vissa anställda finns fortfarande `projects` i deras `user_permissions.modules` (t.ex. äldre anställdkonton som skapats innan senaste ändringar, eller där “default full access” hann gälla).
3) Eftersom `useUserPermissions()` idag har “full access fallback” (ALL_MODULES) vid saknad data/fel, kan det i vissa lägen också leda till att “Projekt” visas.
4) /projects är korrekt skyddad med `ProtectedModuleRoute module="projects"`, men om permissions råkar innehålla `projects` så släpps de in.

Lösning – robust och permanent (3 delar)
A) Gör anställda “hard-restricted” i frontend (även om DB råkar ha fel moduler)
B) Korrigera befintliga anställdas `user_permissions` i databasen (så navigationen blir rätt direkt)
C) Bygg om Dagrapporter-sidan så den faktiskt är den enkla “välj projekt → skriv → skicka”-vyn (utan att skicka dem till projektvyn)

---

A) Frontend: alltid begränsa anställda till rätt moduler
Ändring: `src/hooks/useUserPermissions.ts`
- Lägg till en kontroll: om användaren är anställd (finns aktiv rad i `employees` med `linked_user_id = user.id`) så returnera permissions strikt som:
  ["attendance", "time-reporting", "daily-reports"]
- Detta gör att “Projekt” aldrig visas för anställda, även om deras DB-rad är fel.

Extra: ta bort “full access fallback” för säkerhets skull
- Istället för att på error ge ALL_MODULES, gör en säkrare fallback:
  - Om vi inte kan läsa permissions: ge tom lista (eller minsta möjliga), och visa toast “kunde inte läsa behörighet”.
  - För vanliga admin-konton ska detta sällan inträffa, men det är bättre än att råka ge mer access.

---

B) Backend: uppdatera befintliga anställdas user_permissions en gång
Ändring: skapa en ny migration i `supabase/migrations/…`
- Uppdatera `user_permissions.modules` för alla användare som är länkade som anställda:

Logik
- Identifiera anställda via `employees.linked_user_id` (de konton som faktiskt är anställdkonton).
- Sätt deras modules till exakt: ["attendance","time-reporting","daily-reports"].

Det här gör att:
- anställda får rätt meny direkt utan att behöva förlita sig på frontend-override
- /projects blir spärrad via `ProtectedModuleRoute`

---

C) Dagrapporter: gör sidan till den enda arbetsvyn för anställda
Ändring: `src/pages/DailyReports.tsx`
Just nu:
- sidan listar rapporter och knappen “Ny rapport” navigerar till `/projects/:id?tab=diary` (vilket vi inte vill alls för anställda)

Ny UX (enkel och exakt som du bad om)
1) “Välj projekt” (dropdown)
2) Direkt under: en “Skapa dagrapport”-sektion med formulär
   - Vi återanvänder befintliga komponenten `InlineDiaryCreator` som redan:
     - tar projectId + projectName
     - låter användaren skriva/ev. spela in transkript
     - genererar rapport via backend-funktionen
     - sparar i `daily_reports` via `ReportEditor` (som redan har fix för employee → employer user_id)
3) Efter sparning:
   - Visa “Rapport sparad” och antingen:
     - stanna kvar på Dagrapporter (listan uppdateras)
     - och/eller navigera till `/reports/:id` (om du vill att de ska kunna öppna rapporten efteråt)
   (Jag rekommenderar: stanna kvar + visa den senaste sparade i listan.)

---

D) Rutter/redirect: se till att anställda alltid hamnar på Dagrapporter
Ändring: `src/App.tsx`
- Skydda även /dashboard med `ProtectedModuleRoute module="dashboard"` så att anställda utan dashboard-module inte hamnar där.
- (Alternativt kan vi lägga en automatisk redirect från /dashboard till /daily-reports för anställda, men bäst är att hålla allt modulstyrt.)

Ändring: `src/components/layout/AppLayout.tsx`
- Logo-klick navigerar idag alltid till /dashboard.
- För anställda ska den navigera till första tillgängliga modul (vilket blir /daily-reports).
  - Vi använder permissions-listan för att bestämma “hem”.

---

Filer som påverkas
1) Frontend
- src/hooks/useUserPermissions.ts
  - Lägg in employee-detektion och strikt module-lista
  - Säkerare fallback vid fel
- src/pages/DailyReports.tsx
  - Byt “Ny rapport”-flödet till inline skapande (InlineDiaryCreator)
  - Behåll projektval + rapportlista (valfritt, men jag rekommenderar att listan finns kvar)
- src/App.tsx
  - Wrap /dashboard med ProtectedModuleRoute module="dashboard"
- src/components/layout/AppLayout.tsx
  - Logo/brand click → gå till /daily-reports för anställda (första tillgängliga modul)

2) Backend (databas)
- supabase/migrations/XXXX_fix_employee_permissions.sql
  - Uppdatera befintliga anställdas user_permissions till ["attendance","time-reporting","daily-reports"]

Testplan (end-to-end, det här är viktigt)
1) Logga in som anställd
   - Sidebar ska visa endast: Dagrapporter, Personalliggare, Tidsrapport
   - “Projekt” ska inte synas
2) Gå manuellt till /projects
   - Du ska få toast “saknar behörighet” och redirect till /daily-reports
3) Dagrapporter
   - Välj projekt i dropdown
   - Skapa rapport och spara
   - Rapporten ska dyka upp i listan och kunna öppnas
4) Logga in som admin
   - Admin ser fortsatt “Projekt” och övriga moduler som vanligt
   - Dagrapporter fungerar fortsatt

Risker/edge cases vi hanterar
- Gamla anställdkonton med “projects” i DB: löses av migration + frontend-override
- Tillfälliga fetch-fel för permissions: vi undviker att “råka ge full access”
- Logo som skickar anställda till dashboard: fixas så den går till Dagrapporter

När detta är gjort kommer “Projekt” inte längre vara anställdens upplevelse alls, och Dagrapporter blir exakt den enda arbetsytan: välj projekt → skriv → skicka.
