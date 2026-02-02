

## Lägg till RUT-avdrag och maxgränser för ROT/RUT

### Bakgrund - Aktuella regler 2026

Baserat på min research gäller följande regler för skatteavdrag:

| Avdrag | Avdragsprocent | Maxbelopp/person/år | Tillämpning |
|--------|----------------|---------------------|-------------|
| **ROT** | 30% | 50 000 kr | Arbetskostnad för renovering, ombyggnad, tillbyggnad |
| **RUT** | 50% | 75 000 kr | Arbetskostnad för hushållsnära tjänster |
| **Kombinerat** | - | 75 000 kr | ROT + RUT tillsammans får inte överstiga 75 000 kr |

### Vad som ska byggas

#### 1. RUT-avdrag
Lägg till stöd för RUT-avdrag med samma logik som ROT:
- Separat switch för att aktivera RUT
- Fast 50% avdragsprocent (ej valbart som ROT)
- Beräknas på arbetskostnader märkta som RUT-berättigade

#### 2. Maxgränser med varningar
Visa tydliga varningar när beräknat avdrag överstiger maxgränser:
- ROT-avdrag > 50 000 kr → Varning
- RUT-avdrag > 75 000 kr → Varning
- ROT + RUT > 75 000 kr → Varning

#### 3. Uppdaterad UI
Kombinera ROT och RUT i en gemensam "Skatteavdrag"-panel:
- Visa båda avdragen med respektive switch
- Visa beräknat avdrag för varje typ
- Visa kombinerad summa med maxgräns-info

---

### Teknisk implementation

#### Databas: Nya kolumner

```sql
ALTER TABLE project_estimates 
ADD COLUMN rut_enabled boolean DEFAULT false,
ADD COLUMN rut_percent numeric DEFAULT 50;
```

#### Frontend: State och beräkningar

Uppdatera `useEstimate.ts`:
```typescript
// Ny state
rutEnabled: boolean;
rutPercent: number; // Fast 50%

// Beräkningar
const rutEligibleLaborCost = items
  .filter(item => item.type === "labor" && item.rut_eligible)
  .reduce((sum, item) => sum + item.subtotal, 0);

const rutEligibleWithVat = rutEligibleLaborCost * 1.25;
const rutAmount = rutEnabled ? rutEligibleWithVat * 0.5 : 0;

// Maxgränser
const ROT_MAX = 50000;
const RUT_MAX = 75000;
const COMBINED_MAX = 75000;

const rotCapped = Math.min(rotAmount, ROT_MAX);
const rutCapped = Math.min(rutAmount, RUT_MAX);
const combinedCapped = Math.min(rotCapped + rutCapped, COMBINED_MAX);
```

#### Frontend: Ny komponent

Skapa `TaxDeductionPanel.tsx` som ersätter `RotPanel.tsx`:
- Toggle för ROT (30%)
- Toggle för RUT (50%)
- Visar beräknat avdrag för varje typ
- Varning om maxgräns överskrids
- Info-tooltip som förklarar reglerna

#### Uppdatera tabell

Lägg till RUT-kolumn i `EstimateTable.tsx`:
- Checkbox för RUT-berättigad (liknande ROT)
- Endast synlig när RUT är aktiverat
- Endast för arbetsrader (samma som ROT)

#### PDF-generering

Uppdatera `generateQuotePdf.ts` för att inkludera:
- RUT-avdrag om aktiverat
- Visa maxgränser
- Korrekt "Att betala" efter båda avdragen

---

### Filer som skapas/ändras

| Fil | Ändring |
|-----|---------|
| `supabase/migrations/...` | Lägg till `rut_enabled`, `rut_percent` kolumner |
| `src/hooks/useEstimate.ts` | RUT-state och beräkningar med maxgränser |
| `src/components/estimates/TaxDeductionPanel.tsx` | **NY** - Ersätter RotPanel |
| `src/components/estimates/RotPanel.tsx` | **TA BORT** - Ersätts av TaxDeductionPanel |
| `src/components/estimates/EstimateTable.tsx` | Lägg till RUT-checkbox |
| `src/components/estimates/EstimateBuilder.tsx` | Använd TaxDeductionPanel |
| `src/lib/generateQuotePdf.ts` | RUT i PDF |
| `src/lib/generateEstimatePdf.ts` | RUT i PDF (om finns) |

---

### Ny UI-design för skatteavdragspanelen

```text
┌─────────────────────────────────────────────────────────┐
│  🏠 Skatteavdrag                                        │
├─────────────────────────────────────────────────────────┤
│  ROT-avdrag (30%)                          [  Toggle  ] │
│  Berättigad arbetskostnad: 45 000 kr                    │
│  Beräknat avdrag: 13 500 kr (max 50 000 kr)             │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  RUT-avdrag (50%)                          [  Toggle  ] │
│  Berättigad arbetskostnad: 12 000 kr                    │
│  Beräknat avdrag: 6 000 kr (max 75 000 kr)              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ⚠️ Totalt avdrag: 19 500 kr                            │
│     (max 75 000 kr kombinerat per person/år)            │
└─────────────────────────────────────────────────────────┘
```

---

### Resultat efter implementation

- **ROT-avdrag**: 30% med maxgräns 50 000 kr per person/år
- **RUT-avdrag**: 50% med maxgräns 75 000 kr per person/år
- **Kombinerad gräns**: Max 75 000 kr totalt per person/år
- **Varningar**: Tydliga varningar när gränser överskrids
- **PDF**: Båda avdragen visas korrekt i offerter

