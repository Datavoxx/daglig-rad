

## Fix: Beskrivningsfältet klipps av i ÄTA-raderna

### Problem
Beskrivningsfältet ("Rivning av befintlig vägg") är för smalt i radernas grid-layout. Texten klipps av och syns inte helt. Grid-kolumnerna är `[120px,80px,1fr,70px,90px,auto,32px]` -- efter alla fasta kolumner blir `1fr` bara ~120px.

### Lösning
Två justeringar som löser problemet utan att störa övriga fält:

1. **Bredda dialogen** från `max-w-2xl` till `max-w-3xl` -- ger ca 130px extra utrymme totalt
2. **Ge beskrivningen mer plats i gridet** -- ändra `1fr` till `2fr` så att beskrivningsfältet får dubbelt så mycket av det flexibla utrymmet

### Teknisk ändring i `src/components/projects/ProjectAtaTab.tsx`

**Rad ~489 (grid-layout):**
```
Från: md:grid-cols-[120px,80px,1fr,70px,90px,auto,32px]
Till:  md:grid-cols-[110px,70px,2fr,60px,80px,auto,32px]
```
Minskar artikel/enhet/antal/pris kolumnerna marginellt och ger beskrivningen dubbelt så mycket flex-utrymme.

**Rad ~436 (dialog-bredd):**
```
Från: max-w-2xl
Till:  max-w-3xl
```

### Resultat
Beskrivningsfältet visar hela texten ("Rivning av befintlig vägg") utan att klippa av, och inget annat i layouten störs.
