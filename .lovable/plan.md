

## Fixa layouten i offertposttabellen

### Problem
Kolumnerna i tabellen ar for smala och ser oorganiserade ut. Specifikt:
- "Antal" och "Enhet" sitter ihop
- "A-pris", "Pasl%" och "Summa" ar ihoptryckta
- Kolumnbredderna ar inte proportionella

### Losning
Justera grid-kolumnbredderna sa att varje kolumn far tillrackligt med utrymme:

| Kolumn | Nuvarande bredd | Ny bredd |
|--------|----------------|----------|
| Grip | 20px | 20px (oforandrad) |
| Artikel | 90px | 90px (oforandrad) |
| Beskrivning | 1fr | 1fr (oforandrad) |
| Dolj-ikon | 32px | 28px |
| Antal | 50px | 60px |
| Enhet | 50px | 55px |
| A-pris | 70px | 80px |
| Pasl% | 50px | 60px |
| Summa | 80px | 90px |
| Delete | 28px | 28px (oforandrad) |

### Tekniska andringar

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateTable.tsx` rad 419-423 och 487-491 | Uppdatera `grid-cols-[...]` mallarna med bredare kolumner for alla tre varianter (0, 1 och 2 avdragskolumner) |

Samma mall anvands pa tva stallen: header-raden (rad 417-424) och varje datarad (rad 485-491). Bada uppdateras med identiska nya bredder.

Ingen logik andras, bara CSS grid-bredder.
