
## 4 uppgifter for kvitto-funktionen

### Sammanfattning av de 4 punkterna
1. **Kvitton ska synas som utgifter i projektets ekonomiska oversikt** -- EconomicOverviewCard och ProjectOverviewTab ska inkludera kvitton i utgiftsberakningen.
2. **Fixa mobilvy for fakturor-sidan** -- Tabbar ar ihopklumpade pa mobil. Byt till scrollbar flik-layout eller visa bara ikoner pa mobil.
3. **Kvitto-knappen pa dashboarden ska oppna kameran direkt** -- Navigera till `/invoices?tab=receipts&auto=true` sa att ReceiptUploadDialog oppnas automatiskt (kameran triggas direkt).
4. **Inkludera kvitton i bada PDF-filerna** -- Summerings-PDF och Oversikts-PDF ska visa kvitton som en egen sektion och rakna med dem i ekonomin.

---

### Tekniska detaljer

#### 1. Kvitton i ekonomisk oversikt

**`src/components/projects/EconomicOverviewCard.tsx`**
- Lagg till en fetch av `receipts` med `eq("project_id", projectId)` i `useEffect`.
- Summera `total_inc_vat` fran kvitton.
- Lagg till kvittosumman i `totalExpenses` (vendor + labor + receipts).
- Visa en ny rad under "Leverantorsfakturor" i Collapsible: "Kvitton (X st) -- summa".

**`src/components/projects/ProjectOverviewTab.tsx`**
- Fetcha kvitton i `fetchDashboardData` och inkludera i `expensesTotal`-berakningen.

#### 2. Fixa mobilvy for fakturaflikar

**`src/pages/Invoices.tsx`**
- Andrar TabsList fran `grid grid-cols-4` till en scrollbar layout pa mobil.
- Pa mobil: `flex overflow-x-auto` istallet for grid, med `whitespace-nowrap` pa varje TabsTrigger.
- Alternativt: visa bara ikoner (utan text) pa mobil med `useIsMobile`.

#### 3. Kvitto-knapp pa dashboarden oppnar kameran direkt

**`src/pages/Dashboard.tsx`**
- Andra Kvitto-knappens `href` till `/invoices?tab=receipts&auto=true`.

**`src/pages/Invoices.tsx`**
- Las av URL-parametrarna `tab` och `auto` vid laddning.
- Om `tab=receipts`: satt `activeTab` till "receipts".
- Om `auto=true`: oppna `ReceiptUploadDialog` automatiskt (och trigga fil-input-klick).

**`src/components/invoices/ReceiptList.tsx`**
- Lagg till en prop `autoOpen?: boolean` som om `true` automatiskt oppnar uppladdningsdialogen.

**`src/components/invoices/ReceiptUploadDialog.tsx`**
- Nar dialogen oppnas: automatiskt trigga `fileInputRef.current?.click()` sa att kamera/filval oppnas direkt utan extra klick.

#### 4. Kvitton i PDF-filer

**`src/lib/generateCompleteProjectPdf.ts`**
- Lagg till `receipts` i `CompleteProjectPdfOptions`-interfacet.
- Lagg till en "Kvitton"-sektion i PDFen (efter Leverantorsfakturor): tabell med butik, datum, belopp, momssats.
- Inkludera kvittosumman i "Ekonomisk sammanfattning" som en egen rad.

**`src/lib/generateProjectPdf.ts`**
- Lagg till kvitton i `KpiData` sa att `expensesTotal` inkluderar kvitton.

**`src/pages/ProjectView.tsx`**
- Fetcha kvitton i bade `handleOverviewPdf` och `handleSummaryPdf` och skicka med till PDF-generatorerna.

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/components/projects/EconomicOverviewCard.tsx` | Hamta och visa kvitton som utgift |
| `src/components/projects/ProjectOverviewTab.tsx` | Inkludera kvitton i KPI-berakning |
| `src/pages/Invoices.tsx` | Fixa mobilflikar + las URL-params for auto-oppning |
| `src/pages/Dashboard.tsx` | Andra Kvitto-lanken till auto-oppning |
| `src/components/invoices/ReceiptList.tsx` | Stod for `autoOpen` prop |
| `src/components/invoices/ReceiptUploadDialog.tsx` | Auto-trigga kamera vid oppning |
| `src/lib/generateCompleteProjectPdf.ts` | Lagg till kvitto-sektion + inkludera i ekonomi |
| `src/lib/generateProjectPdf.ts` | Inkludera kvitton i KPI-data |
| `src/pages/ProjectView.tsx` | Fetcha kvitton for bada PDF-generatorer |
