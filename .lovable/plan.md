
## Iteration 2: El/VVS-laget -- Jobbcentrerat UI

### Nuvarande problem
1. **ProjectView visar byggtabbar** for service-anvandare (Oversikt, ATA, Arbetsorder, Filer, Planering, Dagbok) -- detta skapar "projektkansla"
2. **Kvittoscanner saknas i jobbet** -- finns bara under Fakturor
3. **Ingen sticky action bar** -- vanligaste actions kravs scroll for att hitta
4. **Pengasummering ar dold** i arbetsorder-tabben, inte synlig direkt
5. **Sprak ar inte konsekvent** -- "ATA", "Dagbok", "Filer" i service-laget

---

### Sprint 1: Jobbdetalj som nav (KRITISKT)

**1.1 Ny komponent: `src/components/jobs/JobDetailView.tsx`**

Nar service-anvandare navigerar till `/projects/:id` ska de se en sammanslagen jobbvy -- INTE tabbar.

Struktur (uppifraan och ner):

```text
[Header: Jobbnr, Titel, Kund, Adress (klickbar), Telefon (klickbar), Status-steg]
[Pengasummering: Tid kr | Material kr | TOTALT kr -- alltid synligt]
[Accordion-sektioner:]
  1. Tid (ateranvander logik fran ServiceWorkOrderView)
  2. Material (favoriter + manuell)
  3. Kvittoscanner (NY -- integrerad)
  4. Anteckningar
  5. Bilder & dokument (ateranvander ProjectFilesTab)
  6. Extraarbete (ateranvander ProjectAtaTab med omdopt sprak)
[Skapa faktura-knapp (stor, tydlig, nar status = Klar)]
```

Datakallor:
- Hamtar projekt fran `projects`
- Hamtar (eller skapar) work order fran `project_work_orders`
- Tid/material/notes fran befintliga tabeller
- Ateranvander all logik fran `ServiceWorkOrderView.tsx`

**1.2 Modifiera `ProjectView.tsx`**

Lagg till branch-check hogst upp:
- Om `isServiceIndustry` -- rendera `JobDetailView` istallet for tab-layouten
- Bygg-anvandare far befintlig tab-vy (ingen andring)

**1.3 Sticky action bar**

Ny komponent: `src/components/jobs/JobActionBar.tsx`

Desktop: sticky top-bar under header
Mobil: sticky bottom-bar (ovanfor BottomNav)

Knappar:
- Lagg tid (scrollar till tid-sektion)
- Lagg material (scrollar till material-sektion)
- Scanna kvitto (oppnar kvitto-flode)
- Skapa faktura (oppnar fakturadialog)

---

### Sprint 2: Kvittoscanner i jobbet

**2.1 Ny komponent: `src/components/jobs/JobReceiptScanner.tsx`**

Integreras som sektion i JobDetailView.

Flode:
1. Knapp "Scanna kvitto" oppnar kamera (mobil) eller filvalje
2. Bild skickas till befintlig `extract-receipt` edge function
3. Modal visar tolkade rader (artikel, antal, pris)
4. Anvandaren justerar/godkanner
5. Rader laggs direkt i `work_order_materials` pa jobbet
6. Kvittobild sparas i `project-files` bucket

Ateranvander logik fran `ReceiptUploadDialog.tsx` men anpassad:
- Inget projekt-val (redan i jobbet)
- Rader gar till material-tabellen, inte separat kvittotabell

**2.2 Forbattra materialflode**

I JobDetailView:
- Visa fler favoriter (hoja limit fran 10 till 20)
- Lagg till "Senast anvanda" (fran work_order_materials pa detta jobb)
- Snabbare UI: inga onodiga falt synliga -- expanderbara val

---

### Sprint 3: Sprak, schema och polish

**3.1 Sprakandring (mikrocopy)**

Alla platser dar `isServiceIndustry` ar true:

| Nu | Nytt |
|---|---|
| Projekt | Jobb |
| ATA | Extraarbete |
| Dagbok | Anteckningar |
| Filer | Bilder & dokument |
| Oversikt | Jobbkort |
| Planering | Schema |

Specifika filer att andra:
- `ProjectView.tsx` (header-text)
- `ProjectAtaTab.tsx` (rubrik + labels)
- `ProjectFilesTab.tsx` (rubrik)
- `AppLayout.tsx` (redan klart)
- `BottomNav.tsx` (redan klart)

**3.2 Jobblista snabbactions (utveckla)**

Lagg till fler snabbactions pa jobbkort i `JobsList.tsx`:
- "Starta jobb" (status Planerad -> Pagaende)
- "Markera Klar" (status -> Klar)
- "Lagg tid" (inline quick-add)
- "Skapa faktura" (om Klar)

**3.3 Enkelt schema**

Ny vy som visar jobb grupperade per dag (Idag/Imorgon/Vecka).
Enkel listvy -- inte Gantt.

---

### Komponentlista

| Komponent | Status |
|-----------|--------|
| `JobDetailView.tsx` | NY -- sammanslagen jobbvy |
| `JobActionBar.tsx` | NY -- sticky action bar |
| `JobReceiptScanner.tsx` | NY -- kvitto i jobb |
| `JobsList.tsx` | EXISTS -- forbattras med fler snabbactions |
| `CreateJobDialog.tsx` | EXISTS -- behalls |
| `ServiceWorkOrderView.tsx` | EXISTS -- logik ateranvands i JobDetailView |
| `ProjectView.tsx` | EXISTS -- branch-check tillaggs |
| `ProjectAtaTab.tsx` | EXISTS -- sprak-props tillaggs |
| `ProjectFilesTab.tsx` | EXISTS -- sprak-props tillaggs |

### Ingen databasandring kravs

Alla tabeller finns redan:
- `projects`, `project_work_orders`, `work_order_time_entries`, `work_order_materials`, `work_order_notes`, `project_files`, `project_ata`

### Implementeringsordning

1. **Forst**: `JobDetailView` + `ProjectView` branch-check (tar bort projektkanslan)
2. **Sedan**: `JobActionBar` (sticky actions)
3. **Sedan**: `JobReceiptScanner` (kvitto i jobb)
4. **Sedan**: Sprakandring + jobblista-forbattringar
5. **Sist**: Schema-vy
