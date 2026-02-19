

## Korrigeringar i offertfloden

### 1. Rostknapp i offertbyggaren -- minimalistisk stil

**Fil:** `src/components/estimates/EstimateBuilder.tsx`

**Nuvarande problem:** Rad 437-457 anvander en manuell `<div>` med stor avatar-bild (128px), gron text, och `border-dashed border-primary/30` -- den gamla stilen.

**Andring:**
- Importera `VoicePromptButton` fran `@/components/shared/VoicePromptButton`
- Ta bort hela `<div>`-blocket (rad 437-457) med avatar, `bg-primary/5`, och dashed border
- Ersatt med:

```text
<VoicePromptButton
  variant="compact"
  agentName="Byggio AI"
  onTranscriptComplete={handleVoiceEdit}
  isProcessing={isAiProcessing}
/>
```

- Ta bort `Mic`-importen om den inte anvands pa andra stallen (den anvands troligen fortfarande i andra delar)

**Resultat:** En smal, svart/vit knapp med texten "Lat Byggio AI hjalpa dig" -- samma stil som ovriga rostkomponenter i appen.

---

### 2. Dynamiska artikelkategorier i Byggio AI:s offertformular

**Fil:** `src/components/global-assistant/EstimateItemsFormCard.tsx`

**Nuvarande problem:** Rad 58-72 har en hardkodad `ARTICLE_OPTIONS`-array med 13 fasta kategorier. Nya kategorier som laggs till i databasen syns aldrig har.

**Andring:**
- Importera `useArticleCategories` fran `@/hooks/useArticleCategories`
- Byt namn pa hardkodade arrayen till `FALLBACK_ARTICLE_OPTIONS` (behall som fallback)
- Inuti komponenten, anropa hooken:

```text
const { categoryNames, loading: categoriesLoading } = useArticleCategories();
const articleOptions = categoryNames.length > 0 ? categoryNames : FALLBACK_ARTICLE_OPTIONS;
```

- Ersatt alla referenser till `ARTICLE_OPTIONS` med `articleOptions`
- Visa eventuellt en kort laddningsindikator om `categoriesLoading` ar true

**Resultat:** Nar anvandaren skapar en offert i Byggio AI-chatten visas exakt samma kategorier som i den manuella offertbyggaren, inklusive nyligen tillagda kategorier.

---

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Byt manuell rost-div mot `VoicePromptButton variant="compact"` |
| `src/components/global-assistant/EstimateItemsFormCard.tsx` | Ersatt hardkodad `ARTICLE_OPTIONS` med `useArticleCategories` hook |

