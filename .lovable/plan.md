

## Plan: Uppdatera avatarer till transparenta versioner utan cirkulär ram

### Sammanfattning

Jag ersätter de gamla avatarbilderna med de nya transparenta versionerna och tar bort den cirkulära stilen (`rounded-full` + `border`) så att figurerna visas fritt utan ram.

---

### Bildmappning

| Agent | Ny bild (transparent bakgrund) |
|-------|--------------------------------|
| **Ulla** | `ChatGPT_Image_2_feb._2026_23_21_37-removebg-preview.png` |
| **Saga** | `ChatGPT_Image_2_feb._2026_23_21_44-removebg-preview.png` |
| **Bo** | `ChatGPT_Image_2_feb._2026_23_21_47-removebg-preview.png` |

---

### Tekniska ändringar

#### 1. Ersätt bildfilerna

Kopiera de nya transparenta bilderna till `src/assets/`:

| Befintlig fil | Ersätts med |
|---------------|-------------|
| `src/assets/ulla-avatar.png` | `ChatGPT_Image_2_feb._2026_23_21_37-removebg-preview.png` |
| `src/assets/saga-avatar.png` | `ChatGPT_Image_2_feb._2026_23_21_44-removebg-preview.png` |
| `src/assets/bo-avatar.png` | `ChatGPT_Image_2_feb._2026_23_21_47-removebg-preview.png` |

#### 2. Ta bort cirkulär styling

**Fil: `src/components/shared/VoicePromptButton.tsx` (rad 281-285)**

```tsx
// FÖRE
className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 shadow-md"

// EFTER - Ingen rounded-full, ingen border, behåll skugga
className="w-24 h-24 object-contain drop-shadow-lg"
```

**Fil: `src/components/shared/VoiceInputOverlay.tsx` (rad 154-158, 211-215)**

```tsx
// FÖRE
className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 shadow-md"

// EFTER
className="w-16 h-16 object-contain drop-shadow-md"
```

**Fil: `src/components/projects/InlineDiaryCreator.tsx` (rad 377-380)**

```tsx
// FÖRE
className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-md"

// EFTER
className="w-20 h-20 object-contain drop-shadow-lg"
```

**Fil: `src/components/estimates/EstimateBuilder.tsx` (rad 354-357)**

```tsx
// FÖRE
className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-md"

// EFTER
className="w-20 h-20 object-contain drop-shadow-lg"
```

**Fil: `src/components/planning/PlanEditor.tsx` (rad 373-376)**

```tsx
// FÖRE
className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-md"

// EFTER
className="w-20 h-20 object-contain drop-shadow-lg"
```

---

### Styling-ändring sammanfattning

| Klass | Före | Efter |
|-------|------|-------|
| `rounded-full` | Ja | **Nej** (tas bort) |
| `border-2 border-primary/30` | Ja | **Nej** (tas bort) |
| `object-cover` | Ja | **object-contain** (behåll proportioner) |
| `shadow-md` | Ja | **drop-shadow-lg** (skugga direkt på figuren) |

### Storleksjustering

Med transparenta bilder bör storlekarna vara lite större för att figurerna ska synas ordentligt:

| Komponent | Före | Efter |
|-----------|------|-------|
| VoicePromptButton (default) | `w-20 h-20` | `w-24 h-24` |
| VoiceInputOverlay | `w-14 h-14` | `w-16 h-16` |
| InlineDiaryCreator | `w-16 h-16` | `w-20 h-20` |
| EstimateBuilder | `w-16 h-16` | `w-20 h-20` |
| PlanEditor | `w-16 h-16` | `w-20 h-20` |

---

### Visuellt resultat

**Före:**
```
┌─────────────────────────────────────────────┐
│         ╭────────────╮                      │
│         │   ┌────┐   │  ← Cirkulär ram     │
│         │   │SAGA│   │                      │
│         │   └────┘   │                      │
│         ╰────────────╯                      │
│  🎤✨ Låt Saga AI hjälpa dig               │
└─────────────────────────────────────────────┘
```

**Efter:**
```
┌─────────────────────────────────────────────┐
│                                             │
│           ☆                                 │
│         ┌───┐                               │
│         │   │  ← Fri figur utan ram        │
│         │♀ │     med drop-shadow           │
│         └─┬─┘                               │
│          ╱ ╲                                │
│  🎤✨ Låt Saga AI hjälpa dig               │
└─────────────────────────────────────────────┘
```

---

### Filer som ändras

| Fil | Typ |
|-----|-----|
| `src/assets/saga-avatar.png` | Ersätts med ny transparent bild |
| `src/assets/bo-avatar.png` | Ersätts med ny transparent bild |
| `src/assets/ulla-avatar.png` | Ersätts med ny transparent bild |
| `src/components/shared/VoicePromptButton.tsx` | Ta bort rounded-full, border |
| `src/components/shared/VoiceInputOverlay.tsx` | Ta bort rounded-full, border (2 ställen) |
| `src/components/projects/InlineDiaryCreator.tsx` | Ta bort rounded-full, border |
| `src/components/estimates/EstimateBuilder.tsx` | Ta bort rounded-full, border |
| `src/components/planning/PlanEditor.tsx` | Ta bort rounded-full, border |

