

## Plan: Förbättra projektplanerings-PDF

### Problem
1. **Mörk design** - Den mörkblå färgpaletten (slate-700/800) matchar inte Byggios varumärke
2. **Saknar beskrivningar** - Varje fas har en `description`-egenskap som inte visas i PDF:en
3. **Inget Byggio-märke** - PDF:en använder företagets logga, men borde ha Byggio-logga som standard/alternativ
4. **Överblick utan detaljer** - Gantt-diagrammet visar bara fasnamn och längd, inte vad som ska göras

---

### Lösning

#### 1. Byt till Byggio-design
Uppdatera `pdfUtils.ts` med nya färger som matchar Byggios blå primärfärg:

| Nuvarande | Nytt |
|-----------|------|
| `HEADER_BG: [51, 65, 85]` (slate-700) | `HEADER_BG: [37, 99, 235]` (blue-600, Byggio-blå) |
| `DARK: [30, 41, 59]` (slate-800) | `DARK: [15, 23, 42]` (slate-900, djupare kontrast) |

#### 2. Lägg till Byggio-logga
I `generatePlanningPdf.ts`:
- Importera Byggio-loggan från `src/assets/byggio-logo.png`
- Använd Byggio-loggan i header om inget företagslogo finns

#### 3. Visa fasbeskrivningar i momentlistan
Utöka tabellen på sidan 2:
- Lägg till en "Beskrivning"-kolumn i momenttabellen
- Eller visa beskrivningen som en sub-rad under varje fas

#### 4. Ny detaljerad sida: "FASDETALJER"
Lägg till en ny sektion efter Gantt-diagrammet:

```text
┌─────────────────────────────────────────────────────────┐
│  FASDETALJER                                            │
├─────────────────────────────────────────────────────────┤
│  1. Förberedelser och skrapning         V1 (1 vecka)    │
│     ─────────────────────────────────────────────────   │
│     [Beskrivning av fasen om den finns]                 │
│     Parallellt med: —                                   │
├─────────────────────────────────────────────────────────┤
│  2. Målning                              V2 (1 vecka)   │
│     ─────────────────────────────────────────────────   │
│     [Beskrivning av fasen]                              │
│     Parallellt med: —                                   │
└─────────────────────────────────────────────────────────┘
```

---

### Tekniska ändringar

#### Fil 1: `src/lib/pdfUtils.ts`
- Lägg till `BYGGIO_BLUE` färg
- Ändra `HEADER_BG` till blå istället för slate

#### Fil 2: `src/lib/generatePlanningPdf.ts`

**Ändringar:**
1. Importera Byggio-logga som base64-fallback
2. Uppdatera försättssidan med ny design:
   - Blå accentlinje istället för mörkgrå
   - Byggio-logga om ingen företagslogga finns
3. Utöka interface `PlanPhase` med `description`
4. Ersätt "MOMENTLISTA"-tabellen med en ny sektion "FASDETALJER" som visar:
   - Fasnamn med veckonummer
   - Beskrivning (om den finns)
   - Parallellitet
5. Använd färgkodade rubriker per fas baserat på `phase.color`

---

### Förväntad layout (2 sidor)

**Sida 1 - Försättsblad:**
```text
┌─────────────────────────────────────────────────────────┐
│ ═══════════ Blå accent-linje ═══════════                │
│                                                         │
│  [Byggio-logga]            [Företagsnamn om det finns]  │
│                                                         │
│                  PROJEKTPLANERING                       │
│                  ───────────────                        │
│                     tony-test                           │
│                                                         │
│              2026-02-09 → 2026-02-27                    │
│           Total projekttid: ca 3 veckor                 │
│              Antal moment: 3                            │
│                                                         │
│              Genererad 2026-02-03                       │
└─────────────────────────────────────────────────────────┘
```

**Sida 2 - Tidslinje + Detaljer:**
```text
┌─────────────────────────────────────────────────────────┐
│  TIDSLINJE                                              │
│  tony-test • 3 veckor                                   │
│                                                         │
│        V1        V2        V3                           │
│      9-13/2    16-20/2   23-27/2                        │
│  ─────────────────────────────────────                  │
│  Förberedelser  [====]                                  │
│  Målning               [====]                           │
│  Återställning                [====]                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  FASDETALJER                                            │
│                                                         │
│  ●  Förberedelser och skrapning                         │
│     V1 • 1 vecka                                        │
│     Ta bort gammal färg och förbered ytor...            │
│                                                         │
│  ●  Målning                                             │
│     V2 • 1 vecka                                        │
│     Applicera grundfärg och slutfärg...                 │
│                                                         │
│  ●  Återställning av väggmonterade objekt              │
│     V3 • 1 vecka                                        │
│     Montera tillbaka alla objekt...                     │
└─────────────────────────────────────────────────────────┘
```

---

### Sammanfattning

| Ändring | Fil |
|---------|-----|
| Byt header-färg till Byggio-blå | `pdfUtils.ts` |
| Lägg till Byggio-logga som fallback | `generatePlanningPdf.ts` |
| Lägg till "FASDETALJER"-sektion med beskrivningar | `generatePlanningPdf.ts` |
| Visa beskrivning per fas | `generatePlanningPdf.ts` |
| Uppdatera accent-linjer till blå | `generatePlanningPdf.ts` |

