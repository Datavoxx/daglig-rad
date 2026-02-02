
## Plan: Tre huvudförbättringar

Jag har analyserat koden och tagit fram en plan för de tre områdena du nämnde.

---

### 1. Artikelsektion på offertsidan

**Vad ska byggas:**
En ny sektion högst upp på offertsidan (efter projektbeskrivningen) där användaren kan lägga till artiklar från en artikeldatabas. Dessa artiklar fylls sedan automatiskt i offertpostlistan.

**Teknisk implementation:**

| Komponent | Beskrivning |
|-----------|-------------|
| Ny databastabell `articles` | Sparar artiklar med namn, beskrivning, enhet, standardpris, artikel-kategori |
| `ArticleLibrarySection.tsx` | Ny komponent för att välja och lägga till artiklar |
| Uppdatera `EstimateBuilder.tsx` | Lägg till sektionen efter röstkontrollen |
| Settings-flik | Lägg till artikelhantering i Inställningar |

**Databas-schema för `articles`:**
```sql
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  article_category text DEFAULT 'Material',
  unit text DEFAULT 'st',
  default_price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### 2. Begränsade behörigheter för anställda

**Vad ska ändras:**
Anställda ska **endast** ha tillgång till:
- Personalliggare (attendance)
- Dagrapporter (daily_reports via projekts dagbok)
- Tidsrapport (time-reporting)

De ska **inte** ha tillgång till full projektkontroll, kunder, offerter, fakturor eller inställningar.

**Nuvarande status:**
Edge-funktionen `accept-invitation` ger redan begränsade moduler: `["dashboard", "projects", "time-reporting", "attendance"]`. Men anställda har fortfarande tillgång till hela projektvyn.

**Ändringar:**

| Fil | Ändring |
|-----|---------|
| `accept-invitation/index.ts` | Ta bort `projects` från behörigheter, lägg till `daily-reports` |
| `useUserPermissions.ts` | Lägg till `daily-reports` som modul |
| `ProjectView.tsx` | Begränsa vilka tabbar anställda ser (endast Dagbok, Plan om tillåtet) |
| Ny route `/daily-reports` | Skapa en dedikerad dagrapportsida för anställda |
| Uppdatera navigation | Visa "Dagrapporter" istället för "Projekt" för anställda |

**Ny modulstruktur för anställda:**
```
["attendance", "time-reporting", "daily-reports"]
```

---

### 3. Uppdaterad ekonomisk översikt i projektvyn

**Vad ska ändras:**
Ersätt "Budget" med "Utgifter" och visa detaljerad ekonomisk information.

**Ny layout för "Ekonomisk översikt":**

```text
┌─────────────────────────────────────────────────────────┐
│  📊 Ekonomisk översikt                                  │
├─────────────────────────────────────────────────────────┤
│  Offertbelopp                         461 438 kr        │
│                                                         │
│  ▼ Utgifter                          -125 340 kr        │
│    ├─ Leverantörsfakturor             85 000 kr         │
│    └─ Arbetskostnad (timmar)          40 340 kr         │
│                                                         │
│  ▼ ÄTA (godkända)                    +28 500 kr         │
│    └─ 3 godkända poster                                 │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Beräknad marginal                   364 598 kr         │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  27% utnyttjat │
│                                                         │
│  ⚠️ Obs! Denna kalkyl baseras endast på data som        │
│     lagts in i systemet. Poster som saknas påverkar     │
│     inte beräkningen.                                   │
│                                                         │
│  💡 Tips! Se till att anställda valt rätt debiteringstyp│
│     vid tidrapportering för korrekt kostnadskalkyl.     │
└─────────────────────────────────────────────────────────┘
```

**Teknisk implementation:**

| Fil | Ändring |
|-----|---------|
| `ProjectOverviewTab.tsx` | Ny `EconomicOverviewCard` komponent med collapsible-sektioner |
| Nya queries | Hämta `vendor_invoices`, `time_entries` med `billing_types.hourly_rate`, `project_ata` med status="approved" |
| Beräkningar | Utgifter = leverantörsfakturor + (timmar × timpris), ÄTA = godkända poster |
| UI | Progress bar för % utnyttjat, varningar/tips |

**Beräkningslogik:**
```typescript
// Utgifter
const vendorTotal = vendorInvoices.reduce((sum, inv) => sum + inv.total_inc_vat, 0);
const laborCost = timeEntries.reduce((sum, entry) => 
  sum + (entry.hours * (entry.billing_types?.hourly_rate || 0)), 0);
const totalExpenses = vendorTotal + laborCost;

// ÄTA (endast godkända)
const approvedAtaTotal = atas
  .filter(a => a.status === 'approved')
  .reduce((sum, a) => sum + (a.subtotal || 0), 0);

// Marginal och procent
const margin = (linkedEstimate?.total_incl_vat || 0) + approvedAtaTotal - totalExpenses;
const usedPercent = ((totalExpenses) / ((linkedEstimate?.total_incl_vat || 0) + approvedAtaTotal)) * 100;
```

---

### Sammanfattning av filer som ändras/skapas

| Kategori | Fil | Typ |
|----------|-----|-----|
| **Artiklar** | `supabase/migrations/xxx_create_articles.sql` | Ny |
| | `src/components/estimates/ArticleLibrarySection.tsx` | Ny |
| | `src/components/settings/ArticleManager.tsx` | Ny |
| | `src/components/estimates/EstimateBuilder.tsx` | Ändra |
| | `src/pages/Settings.tsx` | Ändra |
| **Behörigheter** | `supabase/functions/accept-invitation/index.ts` | Ändra |
| | `src/hooks/useUserPermissions.ts` | Ändra |
| | `src/pages/DailyReports.tsx` | Ny |
| | `src/components/layout/AppLayout.tsx` | Ändra |
| | `src/App.tsx` | Ändra |
| **Ekonomisk översikt** | `src/components/projects/ProjectOverviewTab.tsx` | Ändra |
| | `src/components/projects/EconomicOverviewCard.tsx` | Ny |

---

### Prioriteringsordning

1. **Ekonomisk översikt** - Minst invasiv, bra att börja med
2. **Behörigheter för anställda** - Kräver ändring i edge function och navigation
3. **Artikelsektion** - Störst scope, ny databastabell och flera komponenter
