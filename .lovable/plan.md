

## Ta bort VoicePromptButton overallt (utom dagbok) och fixa manuell planering

### Del 1: Ta bort VoicePromptButton fran 5 filer

Ta bort importen, state-variabeln `isApplyingVoice`, och VoicePromptButton-komponenten fran:

| Fil | Vad som tas bort |
|-----|-----------------|
| `src/components/estimates/EstimateBuilder.tsx` | Import (rad 14), state `isApplyingVoice`, VoicePromptButton-blocket (rad 409-431) |
| `src/components/reports/ReportEditor.tsx` | Import (rad 18), VoicePromptButton-blocket (rad 325-338) |
| `src/components/projects/ProjectAtaTab.tsx` | Import (rad 53), state `isApplyingVoice`, VoicePromptButton inne i dialogen (rad 464-497) |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Import (rad 13), state `isApplyingVoice`, VoicePromptButton inne i dialogen (rad 244-270) |
| `src/pages/InspectionView.tsx` | Import (rad 33), VoicePromptButton-blocket (rad 222-227) |

### Del 2: Andra dagbokens rostknapp till svartvit stil

I `src/components/projects/InlineDiaryCreator.tsx` (rad 294-309):
- Ta bort importen av `AI_AGENTS` (rad 25)
- Ersatt den stora sektionen med Byggio AI-logga och fargad bakgrund med en enkel, svartvit text:

Fran:
```
<div className="flex items-center gap-4 p-4 mt-2 bg-primary/5 border border-dashed border-primary/30 rounded-lg">
  <img src={AI_AGENTS.diary.avatar} ... className="w-32 h-32 ..." />
  <div>
    <span className="text-sm font-medium text-primary">Lat Byggio AI hjalpa dig</span>
    ...
  </div>
</div>
```

Till:
```
<div className="flex items-center gap-3 p-3 mt-2 border border-dashed border-border rounded-lg">
  <Mic className="h-5 w-5 text-muted-foreground" />
  <div>
    <span className="text-sm font-medium">Lat Byggio AI hjalpa dig</span>
    <span className="text-xs text-muted-foreground block">Spara tid genom att prata</span>
  </div>
</div>
```

### Del 3: Manuell planering (ta bort AI-generering)

I `src/components/projects/ProjectPlanningTab.tsx`:

1. **Ta bort**: Import av `VoicePromptButton`, `AI_AGENTS`, `Sparkles`-ikonen
2. **Ta bort**: `handleGeneratePlan`-funktionen (rad 113-149), `transcript`-state, `generatedConfidence`, `generatedSummary`
3. **Ta bort**: ViewState `"input"` och `"generating"` - de behovs inte langre
4. **Andra `ViewState`** fran `"empty" | "input" | "generating" | "review" | "view"` till `"empty" | "review" | "view"`
5. **Andra empty-state** (rad 237-249): Knappen "Skapa planering" gar direkt till `"review"` med en default-fas:
   ```
   onClick={() => {
     setGeneratedPhases([{ name: "Ny fas", start_day: 1, duration_days: 5, color: "blue" }]);
     setGeneratedTotalDays(5);
     setViewState("review");
   }}
   ```
6. **Andra PlanEditor `onCancel`** (rad 309): Fran `setViewState("input")` till `setViewState("empty")`
7. **Andra PlanEditor-anropet**: Skicka `confidence={1}` och `summary=""` (eller ta bort confidence/summary fran PlanEditor om oonskat - men enklast att bara skicka neutrala varden)

### Teknisk sammanfattning

| Fil | Andring |
|------|-----------|
| `src/components/estimates/EstimateBuilder.tsx` | Ta bort VoicePromptButton + state + import |
| `src/components/reports/ReportEditor.tsx` | Ta bort VoicePromptButton + import |
| `src/components/projects/ProjectAtaTab.tsx` | Ta bort VoicePromptButton + state + import |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Ta bort VoicePromptButton + state + import |
| `src/pages/InspectionView.tsx` | Ta bort VoicePromptButton + import |
| `src/components/projects/InlineDiaryCreator.tsx` | Andra Byggio AI-sektionen till svartvit minimalistisk stil, ta bort AI_AGENTS-import |
| `src/components/projects/ProjectPlanningTab.tsx` | Ta bort AI-generering, VoicePromptButton, input/generating-states. "Skapa planering" gar direkt till PlanEditor med en default-fas. |

