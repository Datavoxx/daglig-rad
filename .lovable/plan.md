

## Plan: Gratis utbildnings-sektion

### Placering
Under **HowItWorksSection** ("Enklare vardag") och över **AIAgentsSection** ("Möt dina AI-kollegor").

---

## Ny komponent: `FreeTrainingSection.tsx`

**Fil:** `src/components/landing/FreeTrainingSection.tsx`

### Design
- Centrerad sektion med gradient-bakgrund (liknande andra sektioner)
- Byggio-logga i toppen
- Rubrik: "Gratis personlig utbildning"
- Undertext om 30-60 min anpassad utbildning
- Två val-kort: 30 min / 60 min
- CTA-knapp: "Boka din utbildning"

### Struktur

```text
┌──────────────────────────────────────────────────────────────┐
│                     [Byggio-logga]                            │
│                                                               │
│            Gratis personlig utbildning                        │
│                                                               │
│   Alla nya användare får en kostnadsfri genomgång av          │
│   Byggio – anpassad efter dina behov.                         │
│                                                               │
│   ┌─────────────────┐    ┌─────────────────┐                 │
│   │    30 min       │    │    60 min       │                 │
│   │  Snabbstart     │    │  Djupdykning    │                 │
│   │  Grunderna i    │    │  Alla moduler   │                 │
│   │  10 minuter     │    │  Q&A session    │                 │
│   └─────────────────┘    └─────────────────┘                 │
│                                                               │
│              [ Boka din utbildning → ]                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Ändringar i Landing.tsx

```tsx
import FreeTrainingSection from "@/components/landing/FreeTrainingSection";

// I <main>:
<HowItWorksSection />
<FreeTrainingSection />  // NY
<AIAgentsSection />
```

---

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/components/landing/FreeTrainingSection.tsx` | NY komponent |
| `src/pages/Landing.tsx` | Importera och lägg till sektionen |

