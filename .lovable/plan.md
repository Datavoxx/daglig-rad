

## Plan: Mobiloptimering av Projektvy-flikarna

### Analys av mobilproblem

Jag har granskat alla sex projektflikar (Översikt, ÄTA, Arbetsorder, Filer, Planering, Dagbok) samt hittat problemet med dubbla tillbaka-knappar i Offerter.

---

### 1. Dubbla tillbaka-knappar i Offerter

**Fil:** `src/pages/Estimates.tsx`

**Problem:** När en offert öppnas i manuellt läge finns det:
1. En "Tillbaka"-knapp i `Estimates.tsx` (rad 252-259)
2. En "Tillbaka"-knapp i `EstimateBuilder.tsx` (rad 284-295 för mobil)

Båda har samma `handleBack`/`onBack` funktion, så användaren ser två identiska knappar.

**Lösning:** Ta bort den yttre "Tillbaka"-knappen i `Estimates.tsx` när EstimateBuilder renderas, eftersom EstimateBuilder redan hanterar sin egen tillbaka-knapp internt via `onBack`-prop.

**Ändring (rad 249-268):**

```tsx
// FÖRE - har en extra Tillbaka-knapp
if (manualStarted && manualData) {
  return (
    <div className="page-transition p-6 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Tillbaka
      </Button>
      <EstimateBuilder ... onBack={handleBack} />
    </div>
  );
}

// EFTER - ingen dubblett
if (manualStarted && manualData) {
  return (
    <div className="page-transition p-4 md:p-6 max-w-6xl mx-auto">
      <EstimateBuilder
        manualData={manualData}
        estimateId={selectedEstimateId}
        onDelete={handleBack}
        onBack={handleBack}
      />
    </div>
  );
}
```

Samma fix behövs för `showWizard`-blocket.

---

### 2. Översikt-fliken

**Fil:** `src/components/projects/ProjectOverviewTab.tsx`

**Status:** ✅ Bra! Redan responsiv med `md:grid-cols-2`.

**Mindre förbättringar:**
- EconomicOverviewCard har varningstexter som kan vara svårlästa på mobil. Lägg till responsiva textstorlekar.

---

### 3. ÄTA-fliken

**Fil:** `src/components/projects/ProjectAtaTab.tsx`

**Problem:** Tabellen med ÄTA-poster (`<Table>`) är för bred för mobil. Kolumner (Artikel, Beskrivning, Enhet, Antal, À-pris, Summa, Status, ROT, Åtgärder) klipps av.

**Lösning:** 
1. Lägg till horisontell scroll på tabellen: `<div className="overflow-x-auto">`
2. Alternativt: Kortlayout på mobil (som vi gjorde för offertlistan)

**Ändring:**

```tsx
// Lägg till wrapper runt Table
<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <Table className="min-w-[800px]">
    ...
  </Table>
</div>
```

Kortare kolumnrubriker på mobil:
- "Beskrivning" → "Besk."
- "À-pris" → behålls
- "Åtgärder" → ikon utan text

---

### 4. Arbetsorder-fliken

**Fil:** `src/components/projects/ProjectWorkOrdersTab.tsx`

**Status:** ✅ Bra! Använder redan kort (`<Card>`) som fungerar bra på mobil.

**Mindre problem:**
- Åtgärdsknappar (Download, More) döljs med `opacity-0 group-hover:opacity-100`. På mobil finns ingen hover. 

**Lösning:** Visa knappar alltid på mobil.

```tsx
<Button
  variant="ghost"
  size="icon"
  className="opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 opacity-100 md:opacity-0 transition-opacity"
  onClick={() => handleDownloadPdf(order)}
>
```

Eller enklare: Ta bort opacity-logiken helt och visa alltid.

---

### 5. Filer-fliken

**Fil:** `src/components/projects/ProjectFilesTab.tsx`

**Status:** ✅ Bra! Kortbaserad layout fungerar.

**Problem:** Samma som Arbetsorder - hover-baserade knappar funkar inte på mobil.

**Lösning:** Visa Download/More-knappar alltid på mobil.

---

### 6. Planering-fliken

**Fil:** `src/components/projects/ProjectPlanningTab.tsx`

**Problem:** 
1. Gantt-tidslinjen (`GanttTimeline`) har `min-w-[600px]` men kan fortfarande vara trång på mobil
2. Bo AI-avataren (`w-32 h-32`) är för stor på mobil

**Lösning:**
1. Använd `PlanningMobileOverview` istället för `GanttTimeline` på mobil (komponenten finns redan!)
2. Minska AI-avataren på mobil till `w-16 h-16`

**Ändring i ProjectPlanningTab.tsx (rad 370-422):**

```tsx
import { useIsMobile } from "@/hooks/use-mobile";
import { PlanningMobileOverview } from "@/components/planning/PlanningMobileOverview";

// I view state:
if (viewState === "view" && plan) {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4">
      {/* ... header ... */}
      
      {isMobile ? (
        <PlanningMobileOverview
          phases={plan.phases}
          totalWeeks={plan.total_weeks}
          startDate={startDate}
        />
      ) : (
        <GanttTimeline
          phases={plan.phases}
          totalWeeks={plan.total_weeks}
          startDate={startDate}
        />
      )}
    </div>
  );
}
```

**AI-avatar (rad 302-306):**

```tsx
<img 
  src={AI_AGENTS.planning.avatar}
  alt="Bo AI"
  className="w-16 h-16 md:w-32 md:h-32 object-contain drop-shadow-lg"
/>
```

---

### 7. Dagbok-fliken

**Fil:** `src/components/projects/ProjectDiaryTab.tsx`

**Status:** ✅ Bra! Redan mobiloptimerad med:
- Responsiv header: `flex-col sm:flex-row`
- Kort med `flex-col sm:flex-row` layout
- Responsiva summary-kort: `grid-cols-2 sm:grid-cols-4`

---

### Sammanfattning av ändringar

| Fil | Problem | Lösning |
|-----|---------|---------|
| `src/pages/Estimates.tsx` | Dubbla tillbaka-knappar | Ta bort yttre knapp |
| `src/components/projects/ProjectAtaTab.tsx` | Tabell för bred | Horisontell scroll + min-width |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Hover-knappar | Visa alltid på mobil |
| `src/components/projects/ProjectFilesTab.tsx` | Hover-knappar | Visa alltid på mobil |
| `src/components/projects/ProjectPlanningTab.tsx` | Gantt för liten + stor avatar | Använd mobil-vy + minska avatar |

---

### Prioritering

1. **Kritiskt:** Dubbla tillbaka-knappar i Offerter (enkelt fix)
2. **Högt:** Planering - använd mobilvy (PlanningMobileOverview finns redan)
3. **Medium:** ÄTA-tabellen - horisontell scroll
4. **Lågt:** Hover-knappar i Arbetsorder/Filer (fungerar fortfarande via dropdown)

