
## Lagg till 2 PDF-knappar i projekthuvudet

### Vad som ska goras

Tva knappar laggs till langst till hoger i projekt-headern (bredvid projektnamn/status-raden):

1. **"Oversikt PDF"** -- Genererar en oversikts-PDF med dagrapporter (anvander befintliga `generateProjectPdf`)
2. **"Summering PDF"** -- Genererar en komplett projektsammanfattning (anvander befintliga `generateCompleteProjectPdf` som idag bara visas vid projektavslut)

### Design

Knapparna placeras langst till hoger i headern som `variant="outline" size="sm"` med ikoner (`FileDown`). Pa mobil visas bara ikonerna.

### Teknisk implementation

**Fil: `src/pages/ProjectView.tsx`**

1. Importera `generateProjectPdf` och `generateCompleteProjectPdf`
2. Lagg till state for loading-indikatorer (`generatingOverview`, `generatingSummary`)
3. Skapa tva async funktioner:
   - `handleOverviewPdf` -- Hamtar dagrapporter fran Supabase och anropar `generateProjectPdf`
   - `handleSummaryPdf` -- Hamtar all projektdata (offert, ATA, tid, arbetsorder, filer, dagbok, leverantorsfakturor, foretagsinstallningar) och anropar `generateCompleteProjectPdf`
4. Rendera tva knappar i headern till hoger om projektnamnet med tooltips

Layout-andringar i headern:

```
<div className="flex items-start gap-4">
  <Button back />
  <div className="space-y-1 flex-1">  {/* projektnamn, kund, status */}
  </div>
  <div className="flex items-center gap-2">  {/* NY -->}
    <Button "Oversikt PDF" />
    <Button "Summering PDF" />
  </div>
</div>
```

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/pages/ProjectView.tsx` | Importera PDF-funktioner, lagg till state + handlers + 2 knappar i headern |

Ingen ny fil behover skapas -- bada PDF-genereringsfunktionerna finns redan (`generateProjectPdf` och `generateCompleteProjectPdf`).
