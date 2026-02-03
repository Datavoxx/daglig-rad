

## Plan: Uppdatera AI-agentsektionen och individuella agentsidor

### Sammanfattning av ändringar

Baserat på din feedback ska jag göra följande:

1. **Byta Sagas avatar** till versionen med borttagen bakgrund
2. **Scroll till toppen** när man går in på en agentsida (använd `useEffect` med `scrollTo`)
3. **Ta bort från Bos capabilities**: "Beroenden" och "Resursöversikt"
4. **Ta bort från Ullas capabilities**: "Avvikelselogg" (behåller "Egenkontroller")
5. **Göra avatarerna större** i AIAgentsSection
6. **Ta bort "AI-drivna assistenter"** badge-texten i headern
7. **Ta bort undertexten** "Tre specialister som jobbar dygnet runt..."
8. **Lägga till en simulation-sektion** högst upp som visar "projekt, offerter, fakturor" med alla tre agenter

---

### 1. Saga Avatar (båda filerna)

Saga använder `saga-avatar.png`. Du nämner att Bo och Ulla redan har bakgrund borttagen men inte Saga. Jag kommer uppdatera bildimporten om det finns en ny fil, eller så behöver du ladda upp en ny bild med borttagen bakgrund. 

**Om ny bild behöver laddas upp**: Ladda upp `saga-avatar.png` med transparent bakgrund så ersätts den automatiskt.

---

### 2. Scroll till toppen vid sidladdning

**Fil:** `src/pages/ai/AgentDetail.tsx`

Lägg till `useEffect` i komponenten för att scrolla till toppen:

```tsx
import { useEffect } from "react";

const AgentDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  // ... rest of component
};
```

---

### 3. Ta bort Bo's capabilities

**Fil:** `src/pages/ai/AgentDetail.tsx`

Ändra Bos `skills` array (rad 76):

```tsx
// FÖRE
skills: ["Tidsplaner", "Gantt-schema", "Fasplanering", "Beroenden", "Resursöversikt"],

// EFTER  
skills: ["Tidsplaner", "Gantt-schema", "Fasplanering"],
```

---

### 4. Ta bort Ullas "Avvikelselogg"

**Fil:** `src/pages/ai/AgentDetail.tsx`

Ändra Ullas `skills` array (rad 101):

```tsx
// FÖRE
skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder", "Egenkontroller", "Avvikelselogg"],

// EFTER
skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder", "Egenkontroller"],
```

---

### 5. Större avatarer i AIAgentsSection

**Fil:** `src/components/landing/AIAgentsSection.tsx`

Ändra avatarstorleken (rad 81-85):

```tsx
// FÖRE
className="w-28 h-28 md:w-32 md:h-32 ..."

// EFTER - 40% större
className="w-36 h-36 md:w-44 md:h-44 ..."
```

Och öka glow-storleken (rad 79):
```tsx
// FÖRE
className="w-24 h-24 rounded-full bg-primary/20 blur-2xl ..."

// EFTER
className="w-32 h-32 rounded-full bg-primary/20 blur-2xl ..."
```

---

### 6. Ta bort "AI-drivna assistenter" badge

**Fil:** `src/components/landing/AIAgentsSection.tsx`

Ta bort hela badge-diven (rad 49-52):

```tsx
// TA BORT DETTA:
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
  <Sparkles className="w-4 h-4" />
  AI-drivna assistenter
</div>
```

---

### 7. Ta bort undertexten

**Fil:** `src/components/landing/AIAgentsSection.tsx`

Ta bort p-taggen (rad 56-58):

```tsx
// TA BORT DETTA:
<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
  Tre specialister som jobbar dygnet runt för att underlätta ditt vardagsjobb
</p>
```

---

### 8. Lägga till Simulation-sektion

**Fil:** `src/components/landing/AIAgentsSection.tsx`

Skapa en ny sektion högst upp som visar de tre agenterna i en "simulation" där de hanterar Projekt, Offerter och Fakturor. Designkoncept:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                      Möt dina AI-kollegor                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    SIMULATION PREVIEW                            │    │
│  │                                                                  │    │
│  │    [SAGA]         [BO]          [ULLA]                          │    │
│  │      ↓             ↓              ↓                              │    │
│  │   Offerter      Projekt       Fakturor                          │    │
│  │                                                                  │    │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐                        │    │
│  │  │ Offert  │   │ Gantt   │   │ Faktura │                        │    │
│  │  │ preview │   │ preview │   │ preview │                        │    │
│  │  └─────────┘   └─────────┘   └─────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│       [SAGA kort]        [BO kort]        [ULLA kort]                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
const AIAgentsSection = () => {
  return (
    <section id="ai-agents" className="py-20 md:py-28 bg-foreground/[0.02] relative overflow-hidden">
      {/* Background effects ... */}

      <div className="container mx-auto px-4 relative z-10">
        {/* Header - endast rubrik */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Möt dina AI-kollegor
          </h2>
        </div>

        {/* SIMULATION SECTION */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="relative bg-card rounded-2xl border border-border/50 p-6 md:p-8 overflow-hidden">
            {/* Top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            {/* Three agent previews side by side */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Saga - Offerter */}
              <div className="text-center">
                <img src={sagaAvatar} alt="Saga" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg" />
                <p className="text-primary font-semibold mb-2">Saga</p>
                <p className="text-xs text-muted-foreground mb-3">hanterar dina</p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                  <p className="font-medium text-primary text-lg">Offerter</p>
                  <p className="text-xs text-muted-foreground">Från röst till proffsig offert</p>
                </div>
              </div>
              
              {/* Bo - Projekt */}
              <div className="text-center">
                <img src={boAvatar} alt="Bo" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg" />
                <p className="text-primary font-semibold mb-2">Bo</p>
                <p className="text-xs text-muted-foreground mb-3">planerar dina</p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                  <p className="font-medium text-primary text-lg">Projekt</p>
                  <p className="text-xs text-muted-foreground">Tidsplaner & Gantt-schema</p>
                </div>
              </div>
              
              {/* Ulla - Fakturor/Dokumentation */}
              <div className="text-center">
                <img src={ullaAvatar} alt="Ulla" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg" />
                <p className="text-primary font-semibold mb-2">Ulla</p>
                <p className="text-xs text-muted-foreground mb-3">dokumenterar dina</p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                  <p className="font-medium text-primary text-lg">Rapporter</p>
                  <p className="text-xs text-muted-foreground">Dagbok, ÄTA & arbetsorder</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent cards grid (befintlig) */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* ... agent cards ... */}
        </div>
      </div>
    </section>
  );
};
```

---

### Sammanfattning av filändringar

| Fil | Åtgärd |
|-----|--------|
| `src/components/landing/AIAgentsSection.tsx` | Ta bort badge + undertext, lägg till simulation, större avatarer |
| `src/pages/ai/AgentDetail.tsx` | Scroll till toppen, ta bort Bos "Beroenden/Resursöversikt", ta bort Ullas "Avvikelselogg" |
| `src/assets/saga-avatar.png` | Behöver uppdateras med transparent bakgrund (om inte redan gjort) |

---

### Tekniska noteringar

- **useEffect för scroll**: Körs när `slug` ändras för att hantera navigering mellan agenter
- **Simulation-sektionen**: Ger en snabb överblick av vad varje agent gör innan användaren scrollar ner till detaljerade kort
- **Avatarer i simulation**: Mindre (80px) för att ge plats åt innehållet
- **Avatarer i kort**: Större (176px på desktop) för premium-känsla

