

## El/VVS-laget: Jobbcentrerat UI for Byggio

### Oversikt

Byggio far ett helt nytt UI-lage for elektriker och VVS som gor **jobbet** (inte projektet) till huvudobjektet. Backend anvander fortfarande `projects`-tabellen, men UI:t talar om "jobb" overallt. Branchen styrs av `useUserIndustry().isServiceIndustry` som redan finns.

---

### Fas 1: Navigation och routing (grund)

**1.1 Sidebar -- branch-specifik meny**

Fil: `src/components/layout/AppLayout.tsx`

`getNavItems()` far en ny gren for `isServiceIndustry`:

```text
Service-meny:
- Jobb         -> /projects     (ikon: Briefcase)
- Kunder       -> /customers    (ikon: Users)
- Offerter     -> /estimates    (ikon: Calculator)
- Fakturor     -> /invoices     (ikon: Landmark)
- Kvitton      -> /invoices?tab=receipts (ikon: Receipt)
- Tidsrapport  -> /time-reporting (ikon: Clock)
- Installningar -> /settings    (ikon: Settings)
```

Ingen "Dagbok", "Personalliggare", "Loneexport", "Guide" i service-menyn (kan finnas bakom installningar).

Hook `useUserIndustry` importeras i AppLayout for att valja ratt meny.

**1.2 Bottom nav (mobil)**

Fil: `src/components/layout/BottomNav.tsx`

Branch-specifik bottom nav for service:

```text
Jobb | Kunder | Offert | Fakturor | Tid
```

Anvander samma `useUserIndustry`-hook.

**1.3 Sokfalt-placeholder**

AppLayout: "Sok jobb, kunder..." istallet for "Sok projekt, rapporter..."

---

### Fas 2: Jobblista (startsida)

**2.1 Ny komponent: `src/pages/Jobs.tsx`**

En wrapper som renderar antingen `Projects.tsx` (bygg) eller ny `JobsList`-komponent (service).

Alternativt: Modifiera `Projects.tsx` med branch-logik.

**Rekommendation**: Skapa `src/components/jobs/JobsList.tsx` som en separat komponent, och lat `Projects.tsx` valja vilken som visas baserat pa `isServiceIndustry`.

**JobsList visar:**
- Sokfalt
- Filterchips: Idag / Pagaende / Planerade / Vantar / Klara / Fakturerade
- "+ Nytt jobb" knapp
- Jobbkort med: nummer, kund, adress, titel, status, tekniker, snabbindikatorer (tid/material/fakturerad)
- Snabbactions pa varje kort: Lagg tid, Lagg material, Ring kund, Oppna

**Data:** Samma `projects`-tabell, men med extra data fran `project_work_orders`, `work_order_time_entries`, `work_order_materials`.

**Skillnad mot nuvarande Projects.tsx:**
- Inget krav pa offert-koppling for att skapa jobb
- Direkt skapande med falt (kund, adress, telefon, titel, beskrivning)
- Jobbcentrerat sprak overallt

**2.2 Nytt jobb-formularet**

Fil: `src/components/jobs/CreateJobDialog.tsx`

Falt:
- Kund (sok/skapa ny)
- Adress (auto fran kund)
- Telefon
- Jobbtitel
- Beskrivning
- Tilldelad tekniker
- Planerat datum (valfritt)
- Status (default: Planerad)

Backend: Skapar en rad i `projects` + automatiskt en rad i `project_work_orders` (service-typ). Anvandaren marker inget av detta -- de "skapar ett jobb".

---

### Fas 3: Jobbdetalj (den viktigaste sidan)

**3.1 Ny komponent: `src/components/jobs/JobDetailView.tsx`**

Denna ersatter nuvarande ProjectView + ServiceWorkOrderView for service-anvandare. Istallet for tabbar (Oversikt/ATA/Arbetsorder/Filer/Planering/Dagbok) far service-anvandare EN vy med sektioner:

```text
[Sticky header: Jobbnummer, Titel, Kund, Adress, Telefon, Status]
[Action bar: Lagg tid | Lagg material | Scanna kvitto | Lagg bild | Skapa faktura]

1. Pengasummering (Tid kr, Material kr, Extraarbete kr, TOTALT kr)
2. Tid (forenkelt, snabb inmatning -- baseras pa befintlig ServiceWorkOrderView)
3. Material (favoriter + manuell + fran kvitto)
4. Kvittoscanner (integrerad i jobbvyn, kamera + forhandsgranskning + lagg pa jobb)
5. Anteckningar (forenkelt, inte byggdagbok)
6. Bilder & dokument
7. Extraarbete (omdopt fran ATA)
8. Skapa faktura (stor knapp langst ner)
```

**Viktig arkitekturlogik:**
- `ProjectView.tsx` kollar `isServiceIndustry` -- om true, rendera `JobDetailView` istallet for tab-layouten
- `JobDetailView` anvander befintlig data fran `project_work_orders`, `work_order_time_entries`, `work_order_materials`, `work_order_notes`
- Mycket av koden fran `ServiceWorkOrderView.tsx` ateranvands -- den har redan tid/material/notes/faktura-logik

**3.2 Kvittoscanner i jobbvyn**

Ny sektion i `JobDetailView` som:
1. Oppnar kameran (mobil) eller fil-upload
2. Skickar bild till befintlig `extract-receipt` edge function
3. Visar forhandsgranskning av tolkade rader
4. Anvandaren godkanner -> raderna laggs i `work_order_materials` pa detta jobb
5. Kvittobilden sparas i `project-files` bucket kopplad till jobbet

Ateranvander logik fran `ReceiptUploadDialog.tsx` men anpassad for jobb-kontexten.

**3.3 Bilder & dokument**

Ateranvander `ProjectFilesTab` med anpassat sprak ("Bilder & dokument" istallet for "Filer").

**3.4 Extraarbete**

Ateranvander `ProjectAtaTab` med sprakandring: "ATA" -> "Extraarbete", "ATA-nummer" -> "Ref", etc.

---

### Fas 4: Statusflodet

Statusar ar redan ratt i `ServiceWorkOrderView`:
- Planerad -> Pagaende -> Vantar -> Klar -> Fakturerad

Ny regel: Nar faktura skapas och markeras skickad -> auto-satt status till "Fakturerad" (redan implementerat i `onSaved`-callback).

Ny UX: Nar status ar "Klar", visa prominent "Skapa faktura"-knapp (redan implementerat, behover bara visas tydligare).

---

### Fas 5: Sprakandring (mikrocopy)

Alla stallen dar `isServiceIndustry` ar true:

| Bygg-lage | El/VVS-lage |
|-----------|-------------|
| Projekt | Jobb |
| Nytt projekt | Nytt jobb |
| ATA | Extraarbete |
| Dagbok | Anteckningar |
| Planering | Schema |
| Filer | Bilder & dokument |
| Oversikt | Jobbkort |
| Arbetsorder | (dold, jobbet AR arbetsordern) |

---

### Teknisk plan: Filer som skapas/andras

**Nya filer:**
1. `src/components/jobs/JobsList.tsx` -- Jobblista med filter, sok, snabbactions
2. `src/components/jobs/CreateJobDialog.tsx` -- Snabbt "Nytt jobb"-formularet
3. `src/components/jobs/JobDetailView.tsx` -- Huvudvy for ett jobb (nav i systemet)
4. `src/components/jobs/JobReceiptScanner.tsx` -- Kvittoscanner integrerad i jobbvyn
5. `src/components/jobs/JobActionBar.tsx` -- Action-knappar (Lagg tid/material/kvitto/bild/faktura)

**Andrade filer:**
6. `src/components/layout/AppLayout.tsx` -- Branch-specifik sidebar-meny
7. `src/components/layout/BottomNav.tsx` -- Branch-specifik bottom nav
8. `src/pages/Projects.tsx` -- Renderar JobsList for service-anvandare
9. `src/pages/ProjectView.tsx` -- Renderar JobDetailView for service-anvandare
10. `src/hooks/useUserIndustry.ts` -- Ingen andring (redan korrekt)

**Ingen databasandring kravs** -- vi ateranvander `projects`, `project_work_orders`, `work_order_time_entries`, `work_order_materials`, `work_order_notes`, `receipts`, `project_files`.

---

### Implementeringsordning

Eftersom detta ar ett stort arbete rekommenderar jag att bryta det i steg:

**Steg 1**: Navigation (AppLayout + BottomNav branch-logik) + Jobblista med "Nytt jobb"-dialog

**Steg 2**: JobDetailView (sammanslagen vy med tid/material/anteckningar/pengasummering/faktura)

**Steg 3**: Kvittoscanner i jobbvyn + Bilder/dokument

**Steg 4**: Extraarbete (ATA omdopt) + sprakpolering

Ska jag borja med Steg 1?

