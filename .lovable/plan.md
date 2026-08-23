# Dashboard för founders: bort med AI, in med Offert & Docs

## Mål
Founder-konton ska inte se Byggio AI någonstans, och deras dashboard ska ge snabb väg till Offerter och Docs plus visa hur många offerter och dokument som finns.

## 1. Ta bort AI för founders
Byggio AI visas idag på tre ställen, alla knutna till modulen "dashboard" (som alla founders har):

- Sidomenyn / mobilnavigering ("Byggio AI" → /global-assistant)
- Dashboardens AI-widget på desktop
- Mobilens snabbruta "Byggio AI"

Alla tre gates om till att bara visas för admin-rollen (mahad@datavoxx.se). Founders ser inget AI-inslag. Rutten finns kvar men blir inte nåbar från gränssnittet för founders.

## 2. Snabbval för Offert och Docs
Ny sektion högst upp på dashboarden (både desktop och mobil) med två tydliga kort:

- "Ny offert" → till offertbyggaren
- "Nytt dokument" → till Docs

Korten visas bara om användaren har respektive modul.

## 3. Nyckeltal: antal offerter och dokument
Två KPI-kort läggs till i dashboardens statistikrad:

- "Offerter" – totalt antal offerter för kontot, klick går till /estimates
- "Dokument" – totalt antal dokument, klick går till /docs

Båda respekterar behörigheter, så en founder med bara offerter/docs ser en komplett men avskalad dashboard istället för en tom yta.

## Tekniska detaljer
- `src/components/layout/AppLayout.tsx`: AI-posten villkoras på `role === "admin"` istället för `moduleKey: "dashboard"`.
- `src/pages/Dashboard.tsx`: ta bort AI-rutan ur mobilrutnätet och rendera `DashboardAssistantWidget` endast för admin; lägg till snabbvalssektion och två nya `KpiCard`.
- Räkningar hämtas i den befintliga `dashboard-data-v2`-queryn med `count: "exact", head: true` mot `project_estimates` och `documents`, filtrerat på inloggad användare.
- Inga databasändringar behövs.
