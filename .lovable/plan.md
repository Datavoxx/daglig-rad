

## Plan: Uppdatera Landing Page med nya funktioner och klickbara detaljsidor

### Sammanfattning

Du vill:
1. **Ta bort "Priser"** från navigeringen och landing page
2. **Ändra FeaturesSection** till fyra nya kategorier:
   - Offert (1st)
   - Projekt (2nd) - innehåller arbetsdagbok och tidsplaner  
   - Fakturering (3rd)
   - AI-integration (4th) - "Bind ihop allting med AI"
3. **Gör varje feature klickbar** - leder till en detaljerad sida med snygg design

---

### Ändringar

#### 1. Ta bort "Priser" från navigering

**Fil: `src/components/landing/LandingNavbar.tsx`**

Uppdatera navLinks från:
```typescript
const navLinks = [
  { label: "Funktioner", href: "#features" },
  { label: "Hur det fungerar", href: "#how-it-works" },
  { label: "Priser", href: "#pricing" },  // ← Ta bort
];
```

Till:
```typescript
const navLinks = [
  { label: "Funktioner", href: "#features" },
  { label: "Hur det fungerar", href: "#how-it-works" },
];
```

---

#### 2. Ta bort PricingSection från Landing.tsx

**Fil: `src/pages/Landing.tsx`**

Ta bort import och användning av PricingSection (om den finns). Notera att jag ser att den inte finns i nuvarande Landing.tsx, så detta är redan klart.

---

#### 3. Omdesigna FeaturesSection med nya kategorier

**Fil: `src/components/landing/FeaturesSection.tsx`**

**Nya features (4 st):**

| Order | Titel | Beskrivning | Mockup |
|-------|-------|-------------|--------|
| 1 | Offerter | Skapa proffsiga offerter snabbt med AI-stöd. Kunden signerar digitalt. | Offert-mockup (befintlig) |
| 2 | Projekthantering | Arbetsdagbok, tidsplaner och dokumentation samlat på ett ställe. | Kombinerad mockup med dagbok + Gantt |
| 3 | Fakturering | Omvandla godkända offerter till fakturor. Spåra betalningar automatiskt. | Ny faktura-mockup |
| 4 | AI som binder ihop allt | Prata in dina anteckningar - AI skapar dokument, offerter och planer åt dig. | AI-orb med text |

**Klickbart:**
Varje kort får en `onClick` eller `Link` som navigerar till `/features/[slug]` för att visa en detaljerad sida.

---

#### 4. Skapa Feature-detaljsidor

**Nya filer:**
- `src/pages/features/FeatureDetail.tsx` - Dynamisk sida som visar feature-detaljer
- `src/pages/features/estimatesFeature.tsx` (eller hårdkoda i FeatureDetail)

**Alternativ approach (enklare):**
En enda `FeatureDetail.tsx` med route `/features/:slug` som läser slug och visar rätt innehåll baserat på feature.

**Design för detaljsida:**
```
+------------------------------------------+
| ← Tillbaka till start                    |
+------------------------------------------+

+------------------------------------------+
| [Ikon/Mockup]                            |
|                                          |
| Rubrik: Offerter utan krångel            |
| Underrubrik: Skapa proffsiga offerter... |
+------------------------------------------+

+-------------+  +-------------+  +-------------+
| Feature 1   |  | Feature 2   |  | Feature 3   |
| Röstinspeln.|  | Digital sign|  | Spåra status|
+-------------+  +-------------+  +-------------+

+------------------------------------------+
| [Stor mockup / screenshot]               |
+------------------------------------------+

+------------------------------------------+
| CTA: Kom igång gratis →                   |
+------------------------------------------+
```

---

#### 5. Routing

**Fil: `src/App.tsx`**

Lägg till nya routes:
```typescript
<Route path="/features/:slug" element={<FeatureDetail />} />
```

---

### Filer som skapas/ändras

| Fil | Ändring |
|-----|---------|
| `src/components/landing/LandingNavbar.tsx` | Ta bort "Priser" från navLinks |
| `src/components/landing/FeaturesSection.tsx` | Nya features: Offert, Projekt, Fakturering, AI. Gör korten klickbara |
| `src/pages/features/FeatureDetail.tsx` | **NY FIL** - Detaljsida för varje feature |
| `src/App.tsx` | Lägg till route `/features/:slug` |

---

### Detaljerad design för varje feature

#### 1. Offerter
- **Kort-titel:** "Offerter som säljer"
- **Kort-beskrivning:** "Skapa proffsiga offerter på minuter. Kunden signerar digitalt direkt i mobilen."
- **Detaljsida:** 
  - Hero med offert-mockup (större)
  - Sub-features: Röstinspelning, Digital signering, Automatisk uppföljning
  - Screenshots/mockups
  - CTA

#### 2. Projekthantering
- **Kort-titel:** "Projekt under kontroll"
- **Kort-beskrivning:** "Arbetsdagbok, tidsplaner och all dokumentation samlat. Delbart med kund och team."
- **Detaljsida:**
  - Hero med kombinerad dagbok + Gantt mockup
  - Sub-features: Dagrapporter med röst, Visuella tidsplaner, ÄTA-hantering, Delning
  - Screenshots
  - CTA

#### 3. Fakturering
- **Kort-titel:** "Fakturering på autopilot"
- **Kort-beskrivning:** "Omvandla godkända offerter till fakturor. Spåra betalningar automatiskt."
- **Detaljsida:**
  - Hero med faktura-mockup
  - Sub-features: Automatisk konvertering, Betalningsspårning, Integration med bokföring
  - CTA

#### 4. AI-integration
- **Kort-titel:** "AI som binder ihop allt"
- **Kort-beskrivning:** "Prata in dina anteckningar – AI skapar dokument, offerter och rapporter åt dig automatiskt."
- **Detaljsida:**
  - Hero med AnimatedAIOrb
  - Sub-features: Röst-till-text, Automatisk strukturering, Smart sammanfattning
  - Demo-sektion
  - CTA

---

### Nya Mockups att skapa

1. **ProjektMockup** - Kombinerar WorkDiaryMockup + PlanningMockup i en snygg layout
2. **InvoiceMockup** - Ny faktura-stil mockup
3. **AIMockup** - AnimatedAIOrb med omgivande text/effekter

---

### Teknisk implementation

**FeaturesSection.tsx - Uppdaterad features array:**

```typescript
const features = [
  {
    slug: "offerter",
    title: "Offerter som säljer",
    description: "Skapa proffsiga offerter på minuter. Kunden signerar digitalt direkt i mobilen.",
    mockup: EstimateMockup,
  },
  {
    slug: "projekt",
    title: "Projekt under kontroll", 
    description: "Arbetsdagbok, tidsplaner och all dokumentation samlat. Delbart med kund och team.",
    mockup: ProjectMockup,  // NY: Kombinerar dagbok + planering
  },
  {
    slug: "fakturering",
    title: "Fakturering på autopilot",
    description: "Omvandla godkända offerter till fakturor. Spåra betalningar automatiskt.",
    mockup: InvoiceMockup,  // NY
  },
  {
    slug: "ai",
    title: "AI som binder ihop allt",
    description: "Prata in dina anteckningar – AI skapar dokument, offerter och rapporter åt dig.",
    mockup: AIMockup,  // NY
  }
];
```

**Klickbart kort:**
```tsx
<Link to={`/features/${feature.slug}`}>
  <TiltCard>
    {/* Befintlig kortdesign */}
  </TiltCard>
</Link>
```

**FeatureDetail.tsx:**
```tsx
const featureData = {
  offerter: {
    title: "Offerter utan krångel",
    heroDescription: "...",
    subFeatures: [...],
    mockup: EstimateMockup,
  },
  projekt: { ... },
  fakturering: { ... },
  ai: { ... },
};

// Använd useParams() för att hämta slug
const { slug } = useParams();
const feature = featureData[slug];
```

---

### Resultat

1. **Navigering:** Endast "Funktioner" och "Hur det fungerar"
2. **Features-sektion:** 4 klickbara kort (Offert, Projekt, Fakturering, AI)
3. **Detaljsidor:** Premium design med hero, sub-features och CTA för varje feature
4. **Konsekvent design:** Samma TiltCard-stil och animationer på alla ställen

