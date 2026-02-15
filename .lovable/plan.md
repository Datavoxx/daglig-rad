

## Fix: Grön glow syns inte på aktiva flikar

### Problem
Den gröna shadow-effekten genereras inte av Tailwind. Kommatecknen i `hsl(142,69%,45%,0.25)` tolkas felaktigt av Tailwinds klassparser. Dessutom finns en konflikt i bas-stilen som kan motverka bakgrundsfärgen.

### Lösning

**Fil: `src/components/ui/tabs.tsx`**

Ta bort `data-[state=active]:bg-background` från bas-stilen i TabsTrigger. Den klassen sätter en vit/mörk bakgrund som slåss mot `bg-primary/10`. Bas-stilen ska bara hantera layout och fokus -- inte aktiv-state-färger som nu hanteras per komponent.

Innan:
```
data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-md
```

Efter:
```
data-[state=active]:text-foreground
```

**Fil: `src/pages/ProjectView.tsx`**

Fixa shadow-syntaxen. Byt komma-separerade HSL-värden till Tailwind-kompatibel syntax med understreck:

Innan:
```
data-[state=active]:shadow-[0_0_12px_hsl(142,69%,45%,0.25)]
```

Efter:
```
data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)]
```

Alla sex triggers (Översikt, ÄTA, Arbetsorder, Filer, Planering, Dagbok) uppdateras med den korrekta syntaxen.

### Resultat
- Grön glow-shadow runt aktiv flik (samma känsla som sidomenyn)
- Grön bakgrund (bg-primary/10) fungerar korrekt
- Grön text och ikoner på aktiv flik
