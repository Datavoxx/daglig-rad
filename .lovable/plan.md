

## Plan: Rensa AI-sektion + Animerad text-simulation i Hero

### Sammanfattning

1. Ta bort den övre "Simulation Section" i AIAgentsSection
2. Uppdatera Sagas avatar till den nya bilden med borttagen bakgrund
3. Ta bort "Funktioner"-badgen i FeaturesSection
4. Skapa en animerad text-rotation i HeroSection där ordet "byggprojekt" byts ut mot: projekt, fakturor, offerter, dagrapporter, arbetsorder

---

### 1. Ta bort Simulation Section

**Fil:** `src/components/landing/AIAgentsSection.tsx`

Ta bort rad 54-96 (hela "Simulation Section"-blocket med Saga/Bo/Ulla och deras Offerter/Projekt/Rapporter-kort).

**EFTER ändring:**

```tsx
<div className="container mx-auto px-4 relative z-10">
  {/* Header */}
  <div className="text-center mb-12">
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
      Möt dina AI-kollegor
    </h2>
  </div>

  {/* Agents grid - DIREKT EFTER HEADER */}
  <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
    {agents.map((agent) => (
      ...
```

---

### 2. Uppdatera Sagas avatar

**Fil:** Kopiera den uppladdade bilden till `src/assets/saga-avatar.png`

Den nya bilden ersätter den befintliga filen, så ingen kodändring behövs - bara filbyte.

---

### 3. Ta bort "Funktioner"-badgen

**Fil:** `src/components/landing/FeaturesSection.tsx`

Ta bort rad 197-199:

```tsx
// TA BORT DETTA:
<span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
  Funktioner
</span>
```

---

### 4. Animerad text-simulation i HeroSection

**Fil:** `src/components/landing/HeroSection.tsx`

Ersätt det statiska ordet "byggprojekt" med en animerad text som roterar mellan fem ord:

- projekt
- fakturor
- offerter
- dagrapporter
- arbetsorder

**Implementation med useState + useEffect:**

```tsx
import { useState, useEffect } from "react";

const rotatingWords = [
  "projekt",
  "fakturor", 
  "offerter",
  "dagrapporter",
  "arbetsorder"
];

const HeroSection = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false); // Fade out
      
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsVisible(true); // Fade in
      }, 300); // Vänta på fade out
    }, 2500); // Byt ord var 2.5 sekund

    return () => clearInterval(interval);
  }, []);

  return (
    <section>
      {/* ... */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tighter mb-8 animate-fade-in">
        <span 
          className={`text-gradient bg-gradient-to-r from-primary via-primary to-emerald-500 inline-block transition-all duration-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {rotatingWords[wordIndex]}
        </span>
      </h1>
      {/* ... */}
    </section>
  );
};
```

**Visuell effekt:**

```
Få full kontroll på dina
     projekt       ← Fade in/out animation
     ↓ (2.5s)
     fakturor
     ↓ (2.5s)
     offerter
     ↓ (2.5s)
     dagrapporter
     ↓ (2.5s)
     arbetsorder
     ↓ (loop)
     projekt
```

---

### Sammanfattning av filer

| Fil | Åtgärd |
|-----|--------|
| `src/assets/saga-avatar.png` | Ersätt med ny bild (background removed) |
| `src/components/landing/AIAgentsSection.tsx` | Ta bort "Simulation Section" (rad 54-96) |
| `src/components/landing/FeaturesSection.tsx` | Ta bort "Funktioner"-badge (rad 197-199) |
| `src/components/landing/HeroSection.tsx` | Lägg till roterande text-animation |

