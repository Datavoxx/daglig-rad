

## 5 forbattringar: Artikelbibliotek, Paslag, Starta Projekt, ATA-artiklar, Planeringsvyn

### Sammanfattning

Fem separata forbattringar som tillsammans gor offert- och projektvyn battre. Varje punkt ar oberoende av de andra.

---

### 1. Artikelbibliotek + Artikelkategori utanfor offerten (pa Estimates-listsidan)

**Problem:** Knappen "Artikelbibliotek" pa offertsidan (`/estimates`) gor en redirect till Installningar. Anvandaren vill istallet ha samma popup-upplevelse som finns inne i offertbyggaren.

**Losning:**
- I `src/pages/Estimates.tsx` (rad 284-291): Byt ut knappen som navigerar till `/settings?tab=articles` mot en knapp som oppnar en lokal dialog for att skapa artiklar (ateranvand samma formularlayout som finns i `ArticleLibrarySection`s `showCreateDialog`).
- Lagg till en andra knapp "Artikelkategorier" bredvid, som oppnar en liknande dialog som visar befintliga kategorier och lat anvandaren skapa nya (ateranvand logiken fran `ArticleCategorySection`).
- Bada dialogerna oppnas inline pa sidan -- ingen navigering bort.

**Filer som andras:**
| Fil | Andring |
|-----|---------|
| `src/pages/Estimates.tsx` | Byt ut navigeringsknappen mot tva dialogknappar (Artikelbibliotek + Artikelkategorier) med inline create-dialoger |

---

### 2. Ta bort auto-paslag

**Problem:** Nar man slar pa paslags-toggeln sa satter systemet automatiskt 10% pa alla poster (`markup_percent: 10`). Anvandaren vill att paslaget enbart sla pa/av toggeln utan att fylla i nagon procent automatiskt.

**Losning:**
- I `src/components/estimates/MarkupPanel.tsx` (rad 21 och 30): Andra `markup_percent: enabled ? (item.markup_percent || 10) : item.markup_percent` till `markup_percent: item.markup_percent`. D.v.s. ta bort fallback-vardet `10` nar man slar pa paslaget.
- Anvandaren maste sjalv skriva in procentsatsen.

**Filer som andras:**
| Fil | Andring |
|-----|---------|
| `src/components/estimates/MarkupPanel.tsx` | Ta bort auto-10% default vid toggle pa master och per-item |

---

### 3. "Starta projekt" blir "Ga till projekt" efter att projekt skapats

**Problem:** Nar man har godkant en offert och skapat ett projekt fran den, sa visar knappen fortfarande "Starta projekt". Den borde byta till "Ga till projekt" och lankas direkt dit.

**Losning:**
- I `src/components/estimates/EstimateBuilder.tsx`: Gor en Supabase-query som kollar om det redan finns ett projekt med `estimate_id` kopplat till den aktuella offerten.
- Om ja: Visa "Ga till projekt" (med `navigate(/projects/{projectId})`) istallet for "Starta projekt".
- Om nej: Visa "Starta projekt" som vanligt.
- Query: `supabase.from("projects").select("id").eq("estimate_id", estimateId).maybeSingle()`
- Galler bade desktop-knappen (rad 393-411) och mobil-vyn.

**Filer som andras:**
| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Lagg till useQuery for att kolla om projekt finns, byt knapptext och beteende |

---

### 4. ATA-tillagg med artikelbibliotek och artikelkategorier

**Problem:** ATA-dialogen i `ProjectAtaTab.tsx` anvander hardkodade artikelkategorier (rad 88-99) istallet for de dynamiska kategorierna fran databasen. Den saknar ocksa mojlighet att valja fran artikelbiblioteket.

**Losning:**
- I `src/components/projects/ProjectAtaTab.tsx`:
  - Ersatt den hardkodade `articleCategories`-arrayen med `useArticleCategories()` hook (samma som offertbyggaren anvander).
  - Lagg till en sektions-knapp "Fran bibliotek" i dialogen som lat anvandaren valja fran sitt artikelbibliotek. Nar en artikel valjs fran biblioteket, fylls raden i automatiskt med namn, enhet, pris och kategori.
  - Hamta artiklar via en Supabase-query (samma monster som `ArticleLibrarySection`).

**Filer som andras:**
| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectAtaTab.tsx` | Byt hardkodade kategorier mot dynamiska, lagg till artikelbibliotek-stod i dialogen |

---

### 5. Byt Projektstatus-kort mot Planeringsvyn

**Problem:** Det nuvarande "Projektstatus"-kortet (fyra statussteg: Planering, Pagaende, Slutskede, Avslutat) visar inte den faktiska projektplaneringen med faser. Anvandaren vill se faserna och Gantt-tidslinjen istallet.

**Losning:**
- I `src/components/projects/ProjectOverviewTab.tsx` (rad 457-458): Ersatt `<ProjectPhaseIndicator />` med en ny sektion:
  - **Om plan finns:** Visa en kompakt version av `GanttTimeline` (samma komponent som anvands i `ProjectPlanningTab`) med faserna och aktuell progress.
  - **Om ingen plan finns:** Visa ett CTA-kort: "Ingen planering skapad annu" med en knapp "Skapa planering" som navigerar till Planering-fliken i projektet.
- Behall `projectStatus` som en liten badge/text ovanfor, men huvudfokus ar planeringsfaserna.

**Filer som andras:**
| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectOverviewTab.tsx` | Ersatt ProjectPhaseIndicator med GanttTimeline eller CTA |

---

### Sammanfattning av alla filandringar

| Fil | Forandring |
|-----|-----------|
| `src/pages/Estimates.tsx` | Inline-dialoger for artikelbibliotek och kategorier |
| `src/components/estimates/MarkupPanel.tsx` | Ta bort auto-10% paslag |
| `src/components/estimates/EstimateBuilder.tsx` | "Ga till projekt"-knapp om projekt finns |
| `src/components/projects/ProjectAtaTab.tsx` | Dynamiska kategorier + artikelbibliotek i ATA |
| `src/components/projects/ProjectOverviewTab.tsx` | Planering/Gantt istallet for Projektstatus-stepper |

