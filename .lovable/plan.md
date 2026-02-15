

## Fix: Gron markering pa aktiva projektflikar (slutgiltig losning)

### Rotorsak

Tva problem samverkar:

1. Bas-komponenten `TabsTrigger` i `src/components/ui/tabs.tsx` har Tailwind-klassen `data-[state=active]:text-foreground` som overridar varje fargandring fran CSS-klassen `.tab-active-glow`.

2. CSS-klassen `.tab-active-glow[data-state="active"]` ligger i `@layer components` i `index.css`. Tailwind-utilities (som `data-[state=active]:text-foreground`) har hogre prioritet an `@layer components`, sa de vinner alltid.

### Losning

**Steg 1: `src/components/ui/tabs.tsx`**

Ta bort `data-[state=active]:text-foreground` fran TabsTrigger-basklassen. Denna klass tvingar texten att bli mork/ljus (foreground) istallet for gron, oavsett vad CSS-klassen sager.

Andring pa rad 30:
- Fore: `... data-[state=active]:text-foreground ...`
- Efter: (borttagen)

**Steg 2: `src/index.css`**

Flytta `.tab-active-glow`-regeln UTANFOR `@layer components` sa att den far hogre specificitet an Tailwind-utilities. Lagg aven till `!important` pa nyckelegenskaperna for att garantera att de inte overrids.

```css
/* Utanfor @layer -- hogre specificitet */
.tab-active-glow[data-state="active"] {
  background-color: hsl(var(--primary) / 0.1) !important;
  color: hsl(var(--primary)) !important;
  border-radius: 0.375rem;
  box-shadow: 0 0 12px hsl(142 69% 45% / 0.25);
}
```

### Varfor det fungerar nu

- Utan `data-[state=active]:text-foreground` i basen finns ingen Tailwind-utility som konkurrerar om farg.
- Genom att flytta regeln utanfor `@layer components` far den hogre prioritet an kvarvarande Tailwind-klasser.
- `!important` ar ett extra skyddsnat for att sakerstalla att ingenting overridar den grona fargen.

### Resultat

Nar du klickar pa t.ex. "Arbetsorder":
- Ljusgron bakgrund runt fliken
- Gron text och ikon
- Gron shadow/glow (precis som sidomenyn visar pa "Projekt" i din skarmbilden)

Inaktiva flikar forblir graa med hover-effekt.

