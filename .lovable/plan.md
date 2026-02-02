

## Plan: Fixa Projekt-mockups och Scroll-till-toppen

### Sammanfattning

Du vill:
1. **Byta ut progress bars (%)** mot en **tidsplan/Gantt-stil** - visa veckor och när saker sker, inte procent
2. **Fixa scroll-problemet** - när man klickar på ett feature-kort ska man hamna högst upp på detaljsidan

---

### Problem 1: Progress bars ska bli tidsplan

**Nuvarande design (FEL):**
```
Rivning   [████████████████████] 100%
Stomme    [████████████░░░░░░░░]  65%
Ytskikt   [███░░░░░░░░░░░░░░░░░]  20%
```

**Ny design (RÄTT - Gantt-stil):**
```
         V1    V2    V3    V4    V5    V6
Rivning  [████]
Stomme         [████████]
Ytskikt                    [██████████]
```

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/landing/FeaturesSection.tsx` | Ändra `ProjectMockup` till Gantt-stil |
| `src/pages/features/FeatureDetail.tsx` | 1. Ändra `ProjectLargeMockup` till Gantt-stil 2. Lägg till `useEffect` för `window.scrollTo(0, 0)` |

---

### Teknisk implementation

#### 1. Ny ProjectMockup (mini-Gantt för FeaturesSection)

```typescript
const ProjectMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm space-y-3">
    {/* Header */}
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-sm font-medium text-foreground">🏗️ Villarenovering</span>
      <Badge variant="outline" className="text-[10px]">V1-V6</Badge>
    </div>
    
    {/* Week headers */}
    <div className="flex gap-0.5 text-[8px] text-muted-foreground pl-14">
      <span className="flex-1 text-center">V1</span>
      <span className="flex-1 text-center">V2</span>
      <span className="flex-1 text-center">V3</span>
      <span className="flex-1 text-center">V4</span>
      <span className="flex-1 text-center">V5</span>
      <span className="flex-1 text-center">V6</span>
    </div>
    
    {/* Gantt bars */}
    <div className="space-y-1.5">
      {/* Rivning: V1 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-12 truncate">Rivning</span>
        <div className="flex-1 flex gap-0.5">
          <div className="flex-1 h-3 bg-emerald-500 rounded" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
        </div>
      </div>
      {/* Stomme: V2-V3 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-12 truncate">Stomme</span>
        <div className="flex-1 flex gap-0.5">
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-blue-500 rounded-l" />
          <div className="flex-1 h-3 bg-blue-500 rounded-r" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
        </div>
      </div>
      {/* Ytskikt: V4-V6 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-12 truncate">Ytskikt</span>
        <div className="flex-1 flex gap-0.5">
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-transparent" />
          <div className="flex-1 h-3 bg-purple-500 rounded-l" />
          <div className="flex-1 h-3 bg-purple-500" />
          <div className="flex-1 h-3 bg-purple-500 rounded-r" />
        </div>
      </div>
    </div>
    
    {/* Tags */}
    <div className="flex gap-2 pt-1">
      <Badge variant="outline" className="text-[10px]">Dagbok</Badge>
      <Badge variant="outline" className="text-[10px]">ÄTA</Badge>
    </div>
  </div>
);
```

#### 2. Ny ProjectLargeMockup (större Gantt för FeatureDetail)

Samma koncept men större och med mer detaljer:
- Fler veckor (V1-V8)
- Fasnamn synliga
- Visuell "nu"-markering
- Senaste aktivitet-sektion behålls

#### 3. Scroll till toppen

Lägg till `useEffect` i `FeatureDetail.tsx`:

```typescript
import { useEffect } from "react";

const FeatureDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  // ... resten av komponenten
};
```

---

### Resultat

1. **Projekt-mockups** visar nu en riktig **tidsplan/Gantt** med veckor och faser som sträcker sig över tid
2. **Klicka på feature-kort** → hamnar alltid **högst upp** på detaljsidan
3. **Tillbaka-knappen** fungerar som vanligt

---

### Visuell jämförelse

**Före (Progress bars):**
```
Rivning   [████████] 100%
Stomme    [█████░░░]  65%
```

**Efter (Gantt-tidslinje):**
```
          V1  V2  V3  V4  V5  V6
Rivning   [██]
Stomme        [████]
Ytskikt             [██████]
```

Gantt-stilen matchar hur tidsplaner faktiskt ser ut i appen och visar **när** saker sker, inte **hur långt** de kommit.
