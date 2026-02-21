

## Fas 1: Service-arbetsorder for Elektriker och VVS

### Oversikt
Nar en anvandare med bransch "vvs" eller "elektriker" oppnar arbetsorder-tabben i ett projekt visas ett helt annat UI anpassat for servicejobb. Arbetsordern blir ett jobbkort med sektioner for kundinfo, tid, material, anteckningar, bilder och fakturering.

Bygg- och Malare-anvandare paverkas inte -- de behallar nuvarande arbetsorder.

### Databasandringar

**Nya tabeller:**

1. `work_order_time_entries` -- tid kopplad direkt till en arbetsorder
   - id (uuid, PK)
   - work_order_id (uuid, FK -> project_work_orders)
   - user_id (uuid)
   - date (date)
   - hours (numeric)
   - billing_type (text, t.ex. "service", "installation", "jour")
   - description (text, nullable)
   - is_billable (boolean, default true)
   - created_at (timestamptz)

2. `work_order_materials` -- material anvant i arbetsordern
   - id (uuid, PK)
   - work_order_id (uuid, FK -> project_work_orders)
   - user_id (uuid)
   - article_name (text)
   - quantity (numeric)
   - unit (text, default "st")
   - unit_price (numeric)
   - category (text, nullable, t.ex. "kabel", "ror", "koppling")
   - is_billable (boolean, default true)
   - sort_order (integer)
   - created_at (timestamptz)

3. `work_order_notes` -- enkel jobblogg
   - id (uuid, PK)
   - work_order_id (uuid, FK -> project_work_orders)
   - user_id (uuid)
   - content (text)
   - created_at (timestamptz)

**Andringar i befintliga tabeller:**

- `project_work_orders` -- lagg till kolumner:
  - `customer_name` (text, nullable)
  - `customer_phone` (text, nullable)
  - `customer_address` (text, nullable)
  - `work_order_type` (text, default "standard") -- "standard" for bygg, "service" for el/vvs
  - `invoice_id` (uuid, nullable) -- koppling till skapad faktura

- `project_work_orders.status` -- nya statusar for service: "planned", "in_progress", "waiting", "completed", "invoiced"

**RLS-policies** for alla nya tabeller: Anvandare kan hantera egna poster (via user_id).

### Kodfiler som andras/skapas

**Nya filer:**

1. `src/hooks/useUserIndustry.ts`
   - Hook som hamtar inloggad anvandares bransch fran `profiles.industry`
   - Returnerar `{ industry, isServiceIndustry, loading }`
   - `isServiceIndustry` ar true om industry = "vvs" eller "elektriker"

2. `src/components/projects/ServiceWorkOrderView.tsx` (STOR komponent)
   - Detaljvy for en enskild service-arbetsorder
   - Visar kundinfo, status, tid, material, anteckningar, bilder, ATA
   - Mobil-first design med tabs/sektioner
   - Innehaller:
     - Kundinfo-header (namn, adress, telefon klickbart)
     - Statusflode-knappar (Planerad -> Pagaende -> Vantar -> Klar -> Fakturerad)
     - Tid-sektion: manuell registrering (timmar, datum, debiteringstyp)
     - Material-sektion: lagg till artiklar, fri rad, pris, debiterbar/ej
     - Anteckningar-sektion: enkel logg
     - Bilder-sektion: ladda upp/ta foto (ateranvander befintlig fil-logik)
     - Extra arbete-sektion (enkel ATA-liknande)
     - Summering: total tid, total materialkostnad
     - Knapp "Skapa faktura" (visas nar status = Klar)

3. `src/components/projects/ServiceWorkOrderList.tsx`
   - Lista over arbetsorder for el/vvs-anvandare
   - Kort med kundnamn, status-badge, tilldelad tekniker
   - Klick oppnar ServiceWorkOrderView
   - Snabb-skapa ny arbetsorder med utokad dialog (kundinfo + telefon)

4. `src/components/projects/ServiceWorkOrderCreateDialog.tsx`
   - Skapardialog anpassad for service: kundnamn, adress, telefon, jobbtitel, beskrivning, tilldelad tekniker

**Andringar i befintliga filer:**

5. `src/pages/ProjectView.tsx`
   - Importera `useUserIndustry` hook
   - I arbetsorder-tabben: om `isServiceIndustry` --> rendera `ServiceWorkOrderList` istallet for `ProjectWorkOrdersTab`

6. `src/components/projects/ProjectWorkOrdersTab.tsx`
   - Ingen andring -- detta forblir bygg/malare-varianten

### Fakturaflode (Fas 1 -- grundlaggande)

Nar anvandaren klickar "Skapa faktura" fran en klar arbetsorder:
1. Samla all debiterbar tid och allt debiterbart material
2. Oppna `CustomerInvoiceDialog` med forifyld data (rader fran tid + material)
3. Anvandaren granskar och sparar
4. Status satt till "invoiced", invoice_id satt

### Mobil-first design

- Alla sektioner i ServiceWorkOrderView anvander accordion/tabs for att minimera scrollning
- Primara actions (lagg tid, lagg material) har stora knappar langst upp
- Kundtelefon ar klickbar (tel: link)
- Snabbflode: oppna arbetsorder -> klicka "Lagg tid" -> skriv timmar -> spara = 3 klick

### Teknisk sekvens

1. Databasmigrering (nya tabeller + kolumner)
2. `useUserIndustry` hook
3. `ServiceWorkOrderCreateDialog`
4. `ServiceWorkOrderList`
5. `ServiceWorkOrderView` (med tid, material, anteckningar, bilder)
6. Koppling i `ProjectView.tsx`
7. Fakturaflode fran arbetsorder

### Vad som INTE ingaar i Fas 1

- Start/stopp-timer (manuella timmar forst, timer i Fas 2)
- Avancerad artikelsokning fran artikelbibliotek (fri text forst)
- PDF-generering av service-arbetsorder
- Notifikationer till tekniker
- Integration med befintligt tidrapporteringssystem (tiderna lever i work_order_time_entries)

