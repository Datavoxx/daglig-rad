

## Fixa Tidsrapportering-staplar pa mobil

### Problem
Den grona stapeln for v.8 ar oproportionerligt stor och tar for mycket plats. Layouten med fast hojd (`h-10`) racker inte for att rymma stapel + veckonummer + timmar, sa det ser trasigt ut.

### Losning

Andra layouten i `src/components/projects/ProjectTimeSection.tsx` sa att:

1. **Separera staplar fran etiketter** -- flytta veckonummer och timmar utanfor stapelcontainern sa de inte tavlar om utrymme.
2. **Begansa stapelhojden** till max 16px pa mobil (24px pa desktop) for en subtilare look.
3. **Anvand en tydligare layout-struktur**:

```text
[==]  [  ]  [  ]  [====]    <-- staplar (fast container, t.ex. h-6)
v.5   v.6   v.7   v.8       <-- veckonummer
 -     -     -    8h         <-- timmar
```

### Teknisk andring

**`src/components/projects/ProjectTimeSection.tsx`** (rad 171-188):

- Bryt ut stapelraden i en egen `div` med fast hojd (`h-6 md:h-8`) och `items-end`.
- Placera veckolabel och timmar i en separat rad under staplarna.
- Minska max barhojd till `16` pa mobil.
- Ta bort `gap-1` inuti varje kolumn for att spara vertikalt utrymme.

Resultatet blir en kompaktare, renare sektion som inte overlappar pa sma skarmar.

