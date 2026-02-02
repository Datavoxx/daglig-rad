

## Plan: Större avatarer och lägg till Bo i projektplanering

### Sammanfattning

1. **Lägga till Bo i projektplanering** (input-state) - för närvarande saknas helt
2. **Göra figurerna större** utan att göra rutorna större

---

### Svar på din fråga

**Ja, det går absolut att göra figuren större utan att göra rutan större!**

Eftersom bilderna nu har transparent bakgrund och använder `object-contain`, kan vi enkelt öka storleken från `w-24 h-24` (96px) till t.ex. `w-32 h-32` (128px) utan att påverka rutans dimensioner. Rutan har `p-4` padding som inte behöver ändras.

---

### Tekniska ändringar

#### 1. Lägg till Bo i ProjectPlanningTab.tsx (input-state)

**Fil:** `src/components/projects/ProjectPlanningTab.tsx`

I input-state (rad 288-314) saknas Bo helt. Vi lägger till en prominent VoicePromptButton-liknande sektion med Bo:

```tsx
// Import AI_AGENTS
import { AI_AGENTS } from "@/config/aiAgents";

// I input-state, lägg till Bo-prompt före Textarea:
<div 
  className="flex items-center gap-4 p-4 bg-primary/5 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
  onClick={startRecording}
>
  <img 
    src={AI_AGENTS.planning.avatar}
    alt="Bo AI"
    className="w-32 h-32 object-contain drop-shadow-lg"
  />
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-primary">
      <Mic className="h-5 w-5" />
      <span className="font-medium">Låt Bo AI hjälpa dig</span>
    </div>
    <span className="text-sm text-muted-foreground">Beskriv planen med rösten</span>
  </div>
</div>
```

#### 2. Öka avatarstorleken i VoicePromptButton.tsx

**Fil:** `src/components/shared/VoicePromptButton.tsx` (rad 284)

```tsx
// Före
className="w-24 h-24 object-contain drop-shadow-lg"

// Efter (större figur, samma ruta)
className="w-32 h-32 object-contain drop-shadow-lg"
```

#### 3. Öka avatarstorleken i EstimateBuilder.tsx

**Fil:** `src/components/estimates/EstimateBuilder.tsx` (rad 357)

```tsx
// Före
className="w-20 h-20 object-contain drop-shadow-lg"

// Efter
className="w-32 h-32 object-contain drop-shadow-lg"
```

#### 4. Öka avatarstorleken i PlanEditor.tsx

**Fil:** `src/components/planning/PlanEditor.tsx` (rad 376)

```tsx
// Före
className="w-20 h-20 object-contain drop-shadow-lg"

// Efter
className="w-32 h-32 object-contain drop-shadow-lg"
```

#### 5. Öka avatarstorleken i InlineDiaryCreator.tsx

**Fil:** `src/components/projects/InlineDiaryCreator.tsx` (rad 380)

```tsx
// Före
className="w-20 h-20 object-contain drop-shadow-lg"

// Efter
className="w-32 h-32 object-contain drop-shadow-lg"
```

---

### Storleksändring sammanfattning

| Komponent | Före | Efter |
|-----------|------|-------|
| VoicePromptButton (default) | `w-24 h-24` (96px) | `w-32 h-32` (128px) |
| EstimateBuilder | `w-20 h-20` (80px) | `w-32 h-32` (128px) |
| PlanEditor | `w-20 h-20` (80px) | `w-32 h-32` (128px) |
| InlineDiaryCreator | `w-20 h-20` (80px) | `w-32 h-32` (128px) |
| ProjectPlanningTab (NY) | Saknas | `w-32 h-32` (128px) |

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/projects/ProjectPlanningTab.tsx` | Lägg till Bo-avatar i input-state |
| `src/components/shared/VoicePromptButton.tsx` | Öka avatar från w-24 till w-32 |
| `src/components/estimates/EstimateBuilder.tsx` | Öka avatar från w-20 till w-32 |
| `src/components/planning/PlanEditor.tsx` | Öka avatar från w-20 till w-32 |
| `src/components/projects/InlineDiaryCreator.tsx` | Öka avatar från w-20 till w-32 |

---

### Visuellt resultat

**Projektplanering (input) - FÖRE:**
```
┌─────────────────────────────────────────────┐
│  Beskriv projektet                   Avbryt │
│  ┌───────────────────────────────────────┐  │
│  │ Textarea...                           │  │
│  └───────────────────────────────────────┘  │
│  [🎤 Spela in]  [Generera plan]             │
└─────────────────────────────────────────────┘
```

**Projektplanering (input) - EFTER:**
```
┌─────────────────────────────────────────────┐
│  Beskriv projektet                   Avbryt │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │  ╭────────╮                             ││
│  │  │   BO   │  🎤 Låt Bo AI hjälpa dig    ││
│  │  │ AVATAR │  Beskriv planen med rösten  ││
│  │  ╰────────╯                             ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Textarea...                           │  │
│  └───────────────────────────────────────┘  │
│  [🎤 Spela in]  [Generera plan]             │
└─────────────────────────────────────────────┘
```

