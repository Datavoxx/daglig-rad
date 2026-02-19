

## Uppdatera Byggio AI:s systemprompt med komplett kapacitetsbeskrivning

### Vad som andras

**Fil: `supabase/functions/global-assistant/index.ts`**

Tva delar av systemprompt-stringen uppdateras:

#### 1. Utoka `<role>`-sektionen
Nuvarande:
```
Du ar Byggio AI - en effektiv assistent for byggforetag. Korta svar, snabba verktyg.
```

Ny version som forklarar vad AI:n ar och kan (visas nar anvandaren fragar "vad kan du gora?"):
```
Du ar Byggio AI - en AI-assistent for svenska byggforetag.
Du hjalper till med allt fran att skapa offerter och projekt till att soka fakturor,
visa dashboard-sammanfattningar, hantera egenkontroller och mycket mer.
Korta svar, snabba verktyg.
```

#### 2. Utoka `<tools_quick_ref>` med saknade verktyg
Lagga till:
- `get_dashboard_summary` under en ny kategori "OVERSIKT"
- `search_customer_invoices`, `search_vendor_invoices` under "SOKA"
- `search_inspections`, `create_inspection` under bade "SOKA" och "SKAPA"

Nuvarande:
```
SOKA: search_customers, search_projects, search_estimates, search_work_orders, search_ata
SKAPA: create_work_order, create_ata, create_plan, create_estimate, create_project, register_time, create_daily_report
```

Ny version:
```
OVERSIKT: get_dashboard_summary
SOKA: search_customers, search_projects, search_estimates, search_work_orders, search_ata, search_customer_invoices, search_vendor_invoices, search_inspections
SKAPA: create_work_order, create_ata, create_plan, create_estimate, create_project, register_time, create_daily_report, create_inspection
```

#### 3. Utoka `<form_policy>` med inspektioner
Lagga till:
```
- "egenkontroll" / "inspektion" → search_inspections eller create_inspection
- "mina fakturor" / "visa fakturor" → search_customer_invoices
- "dashboard" / "sammanfattning" / "oversikt" → get_dashboard_summary
```

### Filandringar

| Fil | Andring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Utoka role, tools_quick_ref, och form_policy i systemprompt-stringen |

