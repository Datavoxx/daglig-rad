
## Plan: Större avatarer och förbättrad synlighet för AI-agenter

### Sammanfattning

Gör avatarbilderna betydligt större och mer synliga i alla röstinspelningskomponenter, samt lägg till Bo på projektöversikten.

---

### Problem identifierade

| Plats | Problem | Nuvarande storlek |
|-------|---------|-------------------|
| VoicePromptButton (default) | Avatar för liten | `w-12 h-12` (48px) |
| VoiceInputOverlay (inspelning) | Avatar för liten | `w-8 h-8` (32px) |
| InlineDiaryCreator (tiptext) | Avatar för liten | `w-5 h-5` (20px) |
| EstimateBuilder (prompt) | Ingen avatar visas | Saknas helt |
| PlanEditor ("Spela in" knapp) | Ingen avatar synlig | Bara i overlay |
| ProjectOverviewTab | Inget röstinmatning | Saknas helt |

---

### Nya storlekar

| Komponent | Nuvarande | Ny storlek |
|-----------|-----------|------------|
| VoicePromptButton (default variant) | `w-12 h-12` | `w-20 h-20` (80px) |
| VoiceInputOverlay (inspelning) | `w-8 h-8` | `w-14 h-14` (56px) |
| InlineDiaryCreator (tiptext) | `w-5 h-5` | `w-10 h-10` (40px) |
| EstimateBuilder (inline prompt) | Saknas | `w-16 h-16` (64px) |

---

### Tekniska ändringar

#### 1. VoicePromptButton.tsx

**Default variant (rad 279-297):**
```tsx
// Före
<img className="w-12 h-12 rounded-full object-cover..." />

// Efter
<img className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-primary/30" />
```

#### 2. VoiceInputOverlay.tsx

**Recording state (rad 210-215) och Confirmation (rad 153-158):**
```tsx
// Före
<img className="w-8 h-8 rounded-full object-cover..." />

// Efter
<img className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-primary/30" />
```

#### 3. InlineDiaryCreator.tsx

**Tips-texten (rad 376-383):**
```tsx
// Före
<img className="w-5 h-5 rounded-full object-cover" />

// Efter  
<img className="w-10 h-10 rounded-full object-cover shadow-sm border border-primary/20" />
```

Byt även ut separat tips-text till ett mer prominent block likt VoicePromptButton.

#### 4. EstimateBuilder.tsx

**Lägg till Saga-avatar i inline prompt (rad 346-361):**
```tsx
// Före - bara mic-ikon
<div className="flex items-center gap-3 p-3 bg-primary/5...">
  <Mic className="h-5 w-5" />
  <span>Låt Saga AI hjälpa dig</span>
</div>

// Efter - med stor avatar
<div className="flex items-center gap-4 p-4 bg-primary/5...">
  <img 
    src={AI_AGENTS.estimate.avatar}
    alt="Saga AI"
    className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-primary/30"
  />
  <div>
    <div className="flex items-center gap-2 text-primary">
      <Mic className="h-5 w-5" />
      <span className="font-medium">Låt Saga AI hjälpa dig</span>
    </div>
    <span className="text-sm text-muted-foreground">Spara 60% av din tid</span>
  </div>
</div>
```

#### 5. PlanEditor.tsx (planering)

Planeringssidan ("Spela in" knappen) har bara en `VoiceInputOverlay` som floating button. Vi ser Bo först när man börjar spela in. 

Användaren vill se Bo innan man börjar spela in. Vi behöver lägga till en mer prominent knapp som visar Bo-avataren direkt i UI:t.

**Lägg till prominent Voice Prompt före "Generera plan" knappen:**

```tsx
// I PlanEditor, efter phases-listan och före actions
<VoicePromptButton
  variant="default"
  agentName="Bo AI"
  agentAvatar={AI_AGENTS.planning.avatar}
  onTranscriptComplete={handleVoiceEdit}
  isProcessing={isApplyingVoice}
  subtext="Beskriv ändringar med rösten"
/>
```

OBS: Användaren sa "skit i att chatta" så vi skippar chat-funktionalitet och fokuserar på större avatarer.

---

### Filer som ändras

| Fil | Ändringstyp |
|-----|-------------|
| `src/components/shared/VoicePromptButton.tsx` | Större avatar (w-20 h-20) |
| `src/components/shared/VoiceInputOverlay.tsx` | Större avatar (w-14 h-14) |
| `src/components/projects/InlineDiaryCreator.tsx` | Större avatar + omdesignad tips-sektion |
| `src/components/estimates/EstimateBuilder.tsx` | Lägg till Saga-avatar i prompt |
| `src/components/planning/PlanEditor.tsx` | Lägg till prominent VoicePromptButton med Bo-avatar |

---

### Visuellt resultat

**Före (VoicePromptButton):**
```
┌─────────────────────────────────────────────┐
│  [tiny avatar]                              │
│  🎤✨ Låt Saga AI hjälpa dig               │
│  Spara upp till 70% av din tid              │
└─────────────────────────────────────────────┘
```

**Efter:**
```
┌─────────────────────────────────────────────┐
│                                             │
│         ╭────────────╮                      │
│         │            │                      │
│         │   SAGA     │  ← 80px avatar       │
│         │  AVATAR    │                      │
│         │            │                      │
│         ╰────────────╯                      │
│                                             │
│  🎤✨ Låt Saga AI hjälpa dig               │
│  Spara upp till 70% av din tid              │
└─────────────────────────────────────────────┘
```

**I VoiceInputOverlay (inspelning):**
```
┌─────────────────────────────────────────────┐
│  ╭──────╮                                   │
│  │ SAGA │  🔴 Saga lyssnar...              │
│  ╰──────╯  ← 56px avatar                   │
│  ─────────────────────────────              │
│  "Vi ska lägga till rivning..."             │
│  [Stoppa inspelning]                        │
└─────────────────────────────────────────────┘
```

---

### OBS: Projektöversikt

Användaren nämnde att lägga till Bo på projektöversikten för att "spela in röstmeddelande och lägga in projektinformation". Detta är en mer omfattande förändring som kräver:
1. Ny voice-to-form logik för projektdata
2. Ny Edge Function för att tolka projektinfo

Jag rekommenderar att vi först gör avatarerna större (denna plan), och sedan lägger till projektöversikts-röstinmatning som ett separat steg om du vill gå vidare med det.
