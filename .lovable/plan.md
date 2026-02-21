
## Fixa mobilvy for projektvisning

### Problem
1. **Flikarna ("tabs") ar avklippta** -- bara Oversikt, ATA, Arbetsorder och halva "File" syns. Planering och Dagbok ar helt osynliga och gar inte att na.
2. **Fliktexten "Filer"** -- ska vara kortare pa mobil eller sa ska alla flikar fa plats.
3. **Tidsrapportering-sektionen** langst ner ser dalig ut pa mobil -- den grona stapeln ar for stor och overlappar.

### Losning

#### 1. Kompaktare flikar pa mobil (`src/pages/ProjectView.tsx`)
- **Ta bort texten och visa bara ikoner pa mobil** (under `md`-breakpoint), behall ikon + text pa desktop.
- Anvand `<span className="hidden md:inline">` runt varje flik-text.
- Detta gor att alla 6 flikar far plats pa en rad utan att behova scrolla.
- Ta bort `<Tooltip>`-wrappern pa mobil (den gor ingenting pa touch) -- behall den pa desktop.

Fore:
```text
[88 Oversikt] [ATA] [Arbetsorder] [File...
```

Efter:
```text
[88] [Pen] [Clip] [Folder] [Cal] [Book]   (mobil, bara ikoner)
[88 Oversikt] [ATA] [Arbetsorder] ...      (desktop, ikon+text)
```

#### 2. Tidsrapportering-sektionen (`src/components/projects/ProjectTimeSection.tsx`)
- Gor veckostaplarna mindre pa mobil: minska `h-12` till `h-10` och max stapelhodjd fran 32px till 24px.
- Gor statistik-raden mer kompakt: minska gap fran `gap-4` till `gap-2` pa mobil.
- "Visa kalender"-knappen: visa som ikon-knapp pa mobil, text pa desktop.

#### 3. Forbattrad scrollning pa flikraden
- Lagg till `flex-nowrap` explicit och sakerstall att `overflow-x-auto` fungerar korrekt pa TabsList.
- Lagg till en subtil fade/gradient pa hoger sida som visuell ledtrad att det finns fler flikar (om ikon-losningen inte racker).

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/pages/ProjectView.tsx` | Gomma fliktexter pa mobil (`hidden md:inline`), visa bara ikoner, ta bort Tooltip-wrapper pa mobil |
| `src/components/projects/ProjectTimeSection.tsx` | Kompaktare layout pa mobil: mindre staplar, tightare stats, kompakt kalenderknapp |
