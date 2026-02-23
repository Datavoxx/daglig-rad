

## Fixar: Auto-start planering och forhandsgransknings-synk

### Problem 1: Planering - "Skapa planering" kraver extra klick
Nar anvandaren valjer "Skapa planering" fran onboarding-dialogen eller fran oversiktens knapp, navigeras de till `?tab=planning` men ser empty-state med ytterligare en "Skapa planering"-knapp. Anvandaren vill ga direkt till PlanEditor.

**Losning:** Lagg till en URL-parameter `?tab=planning&autoStart=true`. Nar `ProjectPlanningTab` ser `autoStart=true` OCH det inte finns nagon befintlig plan, hoppa direkt till "review"-laget med en default-fas (samma logik som knappen).

| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectPlanningTab.tsx` | Lagg till prop `autoStart?: boolean`. I `fetchPlan`, om ingen plan finns och `autoStart` ar sant, satt direkt `generatedPhases` och `viewState="review"` istallet for `"empty"`. |
| `src/pages/ProjectView.tsx` | Las `autoStart` fran searchParams och skicka till `ProjectPlanningTab`. |
| `src/components/projects/ProjectOnboardingDialog.tsx` | Andra `onNavigatePlanning` sa att den navigerar till `?tab=planning&autoStart=true`. |
| `src/components/projects/ProjectOverviewTab.tsx` | Andra "Skapa planering"-knappen (rad 520) sa att den navigerar till `?tab=planning&autoStart=true`. |

### Problem 2: Forhandsgranskning (QuotePreviewSheet) reflekterar inte `show_only_total`
`QuoteLivePreview` hanterar `show_only_total` korrekt (visar streck istallet for antal/enhet/a-pris). Men `QuotePreviewSheet` (popup-versionen) ignorerar detta falt helt - den visar alltid alla varden.

**Losning:** Uppdatera `QuotePreviewSheet` sa att den hanterar `show_only_total` exakt som `QuoteLivePreview`.

| Fil | Andring |
|-----|---------|
| `src/components/estimates/QuotePreviewSheet.tsx` | (1) Lagg till `show_only_total?: boolean` och `description?: string` i `EstimateItem`-interfacet (rad 32-42). (2) I tabellraderna (rad 253-268), lagg till samma villkorliga rendering som i `QuoteLivePreview`: om `item.show_only_total` ar sant, visa streck for antal/enhet/a-pris, annars visa vardena. (3) Visa `item.description || item.moment` som beskrivning. |

### Teknisk sammanfattning

| Fil | Andring |
|------|-----------|
| `src/components/projects/ProjectPlanningTab.tsx` | Ny prop `autoStart`. Auto-ga till "review" med default-fas om ingen plan finns och `autoStart` ar sant. |
| `src/pages/ProjectView.tsx` | Las `autoStart` fran URL och skicka till `ProjectPlanningTab`. |
| `src/components/projects/ProjectOnboardingDialog.tsx` | Navigera med `&autoStart=true`. |
| `src/components/projects/ProjectOverviewTab.tsx` | Navigera med `&autoStart=true`. |
| `src/components/estimates/QuotePreviewSheet.tsx` | Hantera `show_only_total` i tabellrader, visa streck nar dolt. |
