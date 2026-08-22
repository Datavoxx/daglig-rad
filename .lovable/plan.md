# Docs – dokument och anteckningar i JIA

En ny sektion "Docs" i sidomenyn där hela företaget kan skriva, spara och hitta dokument – ungefär som Google Docs, fast inbyggt i plattformen.

## Så fungerar det

**Docs-listan (`/docs`)**
- Alla företagets dokument i en lista: titel, vem som senast ändrade, när, och ev. kopplat projekt/kund.
- Sökfält (titel + innehåll), filter på projekt/kund, och "Nytt dokument".
- Radera/döp om via meny på varje rad.

**Dokumentvyn (`/docs/:id`)**
- Titel högst upp som redigeras direkt i sidan.
- Rik textredigerare: rubriker (H1–H3), fet/kursiv/understruken, punkt- och nummerlistor, checklistor, citat, länkar, tabeller, avdelare.
- Autospar ca 1,5 sekunder efter senaste tangenttryck. Diskret text "Sparat 14:12" – ingen spinner.
- Sidopanel/rad för att koppla dokumentet till ett projekt eller en kund (valfritt).
- Export till PDF senare om det önskas (ingår inte i detta steg).

**Delning och behörighet**
- Alla i samma företag ser och kan redigera samma dokument (ägare + anställda), precis som resten av plattformen.
- Anställda får Docs i sin meny och på sin dashboard.
- Senaste sparning vinner – ingen samtidig live-redigering i detta steg.

**Koppling till projekt/kund**
- Ett dokument kan pekas mot ett projekt eller en kund.
- På projektsidan får projektet en flik "Dokument" som visar de dokument som är kopplade dit och låter en skapa nya direkt därifrån.

## Teknisk plan

**Databas** – ny tabell `public.documents`:
- `id`, `user_id` (ägarkonto = företagets user_id), `created_by`, `updated_by`, `title` (default "Namnlöst dokument"), `content` jsonb (TipTap-JSON), `plain_text` text (för sökning), `project_id` null, `customer_id` null, `created_at`, `updated_at`.
- GRANT SELECT/INSERT/UPDATE/DELETE till `authenticated`, ALL till `service_role`.
- RLS enligt befintligt mönster: `user_id = auth.uid() OR user_id = public.get_employer_id(auth.uid())` för select/insert/update/delete.
- Trigger `update_updated_at_column` på update.

**Editor**: TipTap (`@tiptap/react`, `starter-kit`, `placeholder`, `link`, `task-list`, `task-item`, `table`-paket). Egen toolbar byggd med befintliga shadcn-knappar och designtokens – inga hårdkodade färger.

**Filer**
- `src/pages/Docs.tsx` – lista, sök, filter, skapa/radera.
- `src/pages/DocView.tsx` – editorvy med titel, autospar, koppling.
- `src/components/docs/DocEditor.tsx` + `DocToolbar.tsx` – TipTap-editorn.
- `src/components/docs/DocLinkPicker.tsx` – välj projekt/kund.
- `src/hooks/useDocuments.ts` – hämta/spara/autospar (debounce 1500 ms).
- `src/components/projects/ProjectDocsTab.tsx` – fliken i projektvyn.

**Integration**
- `src/App.tsx`: rutter `/docs` och `/docs/:id` inom `ProtectedRoute` + `ProtectedModuleRoute module="docs"`.
- `src/hooks/useUserPermissions.ts`: lägg `docs` i `ALL_MODULES` och i `EMPLOYEE_MODULES`.
- `src/components/layout/AppLayout.tsx`: "Docs" (FileText-ikon) i bygg-, service- och anställd-menyn.
- `src/components/layout/BottomNav.tsx`: mobilnavigering rymmer max 5 – Docs läggs i hamburgermenyn, inte i bottenraden.
- `src/pages/EmployeeDashboard.tsx`: kort för Docs med antal dokument.

**UI-regler som följs**
- Inga laddningsindikatorer – tom vy renderas medan data hämtas.
- Dialoger: 300 ms ease-out, mobil `w-[calc(100%-2rem)]`.
- Endast semantiska designtokens.
