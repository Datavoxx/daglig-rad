
## Plan: Tre huvudförbättringar - IMPLEMENTERAT ✅

Alla tre förbättringar har implementerats:

---

### 1. ✅ Artikelsektion på offertsidan

**Implementerat:**
- Ny databastabell `articles` för artikelbibliotek
- `ArticleLibrarySection.tsx` - Expanderbar sektion på offertsidan
- `ArticleManager.tsx` - Hantering av artiklar i Inställningar
- Ny flik "Artiklar" i inställningar

---

### 2. ✅ Begränsade behörigheter för anställda

**Implementerat:**
- Edge function `accept-invitation` uppdaterad: anställda får endast `["attendance", "time-reporting", "daily-reports"]`
- Ny modul `daily-reports` tillagd i `useUserPermissions.ts`
- Ny sida `DailyReports.tsx` för anställda
- Navigation uppdaterad med "Dagrapporter" länk
- Anställda kan **inte** längre se projekt, offerter, kunder, fakturor eller inställningar

---

### 3. ✅ Uppdaterad ekonomisk översikt i projektvyn

**Implementerat:**
- `EconomicOverviewCard.tsx` - Ersätter gamla budget-kortet
- Visar: Offertbelopp, Utgifter (leverantörsfakturor + arbetskostnad), ÄTA (godkända)
- Collapsible sektioner för detaljer
- Progress bar för % utnyttjat
- Varnings-box om att data kan vara ofullständig
- Tips-box om att välja rätt debiteringstyp

---

### Skapade/ändrade filer

| Fil | Åtgärd |
|-----|--------|
| `supabase/migrations/...` | Ny `articles` tabell |
| `src/components/projects/EconomicOverviewCard.tsx` | Ny |
| `src/components/estimates/ArticleLibrarySection.tsx` | Ny |
| `src/components/settings/ArticleManager.tsx` | Ny |
| `src/pages/DailyReports.tsx` | Ny |
| `src/components/projects/ProjectOverviewTab.tsx` | Uppdaterad |
| `src/hooks/useUserPermissions.ts` | Uppdaterad |
| `supabase/functions/accept-invitation/index.ts` | Uppdaterad |
| `src/components/layout/AppLayout.tsx` | Uppdaterad |
| `src/App.tsx` | Uppdaterad |
| `src/pages/Settings.tsx` | Uppdaterad |
| `src/components/estimates/EstimateBuilder.tsx` | Uppdaterad |
