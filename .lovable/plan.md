
## Kolumnrubriker ovanför ÄTA-raderna

### Problem
Det finns inga kolumnrubriker som visar vad varje fält i raden representerar (Artikel, Enhet, Beskrivning, Antal, À-pris, ROT). Användaren måste gissa sig till vad fälten är.

### Lösning
Lägg till en rubrikrad (header row) med samma grid-layout som dataraderna, som bara visas på desktop (md och uppåt). På mobil syns redan labels per fält.

### Teknisk ändring i `src/components/projects/ProjectAtaTab.tsx`

Innan `{formRows.map(...)}`-loopen (rad ~486), lägg till en dold-på-mobil rubrikrad:

```tsx
<div className="hidden md:grid md:grid-cols-[110px,70px,2fr,60px,80px,auto,32px] gap-2 px-3 text-xs text-muted-foreground font-medium">
  <span>Artikel</span>
  <span>Enhet</span>
  <span>Beskrivning</span>
  <span>Antal</span>
  <span>À-pris</span>
  <span>ROT</span>
  <span></span>
</div>
```

Rubrikerna matchar exakt kolumnbredden i raderna och syns bara på desktop -- på mobil visas redan per-fält-labels. Inga andra ändringar behövs.
