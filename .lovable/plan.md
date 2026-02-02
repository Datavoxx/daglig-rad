
## Plan: Lägg till AI-agentavatarer

### Sammanfattning

Jag lägger till de tre uppladdade avatarbilderna (Saga, Bo, Ulla) i röstinspelningskomponenterna så att användaren ser vem som hjälper dem.

### Bildmappning

| Agent | Bild | Identifiering |
|-------|------|---------------|
| **Saga AI** | `ChatGPT_Image_2_feb._2026_23_21_44.png` | Blond, miniräknare + offertblad |
| **Bo AI** | `ChatGPT_Image_2_feb._2026_23_21_47.png` | Pojke med ritningar |
| **Ulla AI** | `ChatGPT_Image_2_feb._2026_23_21_37.png` | Tjej med surfplatta |

---

### Tekniska ändringar

#### 1. Kopiera bilder till assets-mappen

Flytta bilderna till `src/assets/` med tydliga namn:
- `src/assets/saga-avatar.png`
- `src/assets/bo-avatar.png`
- `src/assets/ulla-avatar.png`

#### 2. Uppdatera agent-konfigurationen

**Fil: `src/config/aiAgents.ts`**

Lägg till `avatar`-property för varje agent:

```typescript
import sagaAvatar from "@/assets/saga-avatar.png";
import boAvatar from "@/assets/bo-avatar.png";
import ullaAvatar from "@/assets/ulla-avatar.png";

export interface AIAgent {
  name: string;
  title: string;
  description: string;
  promptIntro: string;
  avatar: string;  // NY
}

export const AI_AGENTS = {
  estimate: {
    name: "Saga",
    title: "Saga AI",
    description: "Din kalkylexpert",
    promptIntro: "...",
    avatar: sagaAvatar,
  },
  planning: {
    name: "Bo",
    title: "Bo AI",
    description: "Din projektplanerare",
    promptIntro: "...",
    avatar: boAvatar,
  },
  diary: {
    name: "Ulla",
    title: "Ulla AI",
    description: "Din dokumentationsassistent",
    promptIntro: "...",
    avatar: ullaAvatar,
  },
} as const;
```

#### 3. Uppdatera VoicePromptButton

**Fil: `src/components/shared/VoicePromptButton.tsx`**

Lägg till `agentAvatar`-prop och visa avatar:

```typescript
interface VoicePromptButtonProps {
  // ... befintliga props
  agentAvatar?: string;  // NY
}
```

Visa avatar i default-varianten:

```tsx
// I default-varianten (rad 269-290)
<div className="flex flex-col items-center gap-2 text-center">
  {agentAvatar && (
    <img 
      src={agentAvatar} 
      alt={agentName || "AI"} 
      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
    />
  )}
  <div className="flex items-center gap-2 text-primary">
    ...
  </div>
</div>
```

#### 4. Uppdatera VoiceInputOverlay

**Fil: `src/components/shared/VoiceInputOverlay.tsx`**

Lägg till `agentAvatar`-prop och visa avatar i inspelnings-/bekräftelsevyn:

```typescript
interface VoiceInputOverlayProps {
  // ... befintliga props
  agentAvatar?: string;  // NY
}
```

Visa avatar i overlay:

```tsx
// I recording-state och confirmation-dialog
{agentAvatar && (
  <img 
    src={agentAvatar} 
    alt={agentName || "AI"} 
    className="w-8 h-8 rounded-full object-cover"
  />
)}
```

#### 5. Uppdatera användningsplatser

Skicka `agentAvatar` prop till komponenter:

| Fil | Agent | Ändring |
|-----|-------|---------|
| `EstimateBuilder.tsx` | Saga | `agentAvatar={AI_AGENTS.estimate.avatar}` |
| `EstimateSummary.tsx` | Saga | `agentAvatar={AI_AGENTS.estimate.avatar}` |
| `CreateTemplateDialog.tsx` | Saga | Visa avatar bredvid inspelningsknapp |
| `PlanEditor.tsx` | Bo | `agentAvatar={AI_AGENTS.planning.avatar}` |
| `InlineDiaryCreator.tsx` | Ulla | Visa avatar i text/inspelning |
| `ReportEditor.tsx` | Ulla | `agentAvatar={AI_AGENTS.diary.avatar}` |
| `ProjectWorkOrdersTab.tsx` | Ulla | `agentAvatar={AI_AGENTS.diary.avatar}` |
| `ProjectAtaTab.tsx` | Ulla | `agentAvatar={AI_AGENTS.diary.avatar}` |
| `InspectionView.tsx` | Ulla | `agentAvatar={AI_AGENTS.diary.avatar}` |

---

### UI-förändring

**Före (VoicePromptButton):**
```
┌─────────────────────────────────────────────┐
│  🎤✨ Låt Saga AI hjälpa dig               │
│  Spara upp till 70% av din tid              │
└─────────────────────────────────────────────┘
```

**Efter:**
```
┌─────────────────────────────────────────────┐
│         [SAGA AVATAR]                       │
│  🎤✨ Låt Saga AI hjälpa dig               │
│  Spara upp till 70% av din tid              │
└─────────────────────────────────────────────┘
```

**I VoiceInputOverlay (inspelning):**
```
┌─────────────────────────────────────────────┐
│  [AVATAR] 🔴 Saga lyssnar...               │
│  ─────────────────────────────              │
│  "Vi ska lägga till rivning..."             │
│  [Stoppa inspelning]                        │
└─────────────────────────────────────────────┘
```

---

### Filer som ändras

| Fil | Typ | Ändring |
|-----|-----|---------|
| `src/assets/saga-avatar.png` | NY | Kopiera från upload |
| `src/assets/bo-avatar.png` | NY | Kopiera från upload |
| `src/assets/ulla-avatar.png` | NY | Kopiera från upload |
| `src/config/aiAgents.ts` | ÄNDRA | Lägg till avatar-property |
| `src/components/shared/VoicePromptButton.tsx` | ÄNDRA | Visa avatar |
| `src/components/shared/VoiceInputOverlay.tsx` | ÄNDRA | Visa avatar |
| `src/components/estimates/EstimateBuilder.tsx` | ÄNDRA | Skicka avatar |
| `src/components/estimates/EstimateSummary.tsx` | ÄNDRA | Skicka avatar |
| `src/components/estimates/CreateTemplateDialog.tsx` | ÄNDRA | Visa Saga avatar |
| `src/components/planning/PlanEditor.tsx` | ÄNDRA | Skicka avatar |
| `src/components/projects/InlineDiaryCreator.tsx` | ÄNDRA | Visa Ulla avatar |
| `src/components/reports/ReportEditor.tsx` | ÄNDRA | Skicka avatar |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | ÄNDRA | Skicka avatar |
| `src/components/projects/ProjectAtaTab.tsx` | ÄNDRA | Skicka avatar |
| `src/pages/InspectionView.tsx` | ÄNDRA | Skicka avatar |

---

### Resultat

Användaren ser nu en visuell representation av varje AI-agent:
- **Saga** (blond med miniräknare) i offertbyggaren och mallskaparen
- **Bo** (pojke med ritningar) i projektplaneringen
- **Ulla** (tjej med surfplatta) i dagbok, ÄTA, arbetsorder och egenkontroll
