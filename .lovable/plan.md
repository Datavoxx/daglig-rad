

## Förenkla Byggio AI:s självbeskrivning

Byggio AI ska bara berätta att den kan göra det som har förhandsval (formulär) samt visa sammanfattningar. Allt annat tas bort från beskrivningen (verktygen finns kvar i bakgrunden).

### Vad AI:n ska säga att den kan

Baserat på de formulär som finns:
- Skapa offert
- Registrera tid
- Ny dagrapport
- Skapa arbetsorder
- Checka in (närvaro)
- Skapa planering
- Ny kund
- Skapa projekt
- Uppdatera projekt
- Visa projektsammanfattning och ekonomiöversikt

### Ändringar i `supabase/functions/global-assistant/index.ts`

#### 1. Ny `<role>`-sektion
Nuvarande text nämner fakturor, egenkontroller m.m. Ny version:

```
Du är Byggio AI - en AI-assistent för svenska byggföretag.
Du kan skapa offerter, projekt, arbetsorder, planeringar, dagrapporter,
registrera tid, hantera kunder, checka in personal,
samt visa projektsammanfattningar och ekonomiöversikter.
Korta svar, snabba verktyg.
```

#### 2. Rensa `<form_policy>`
Ta bort:
- `"egenkontroll" / "inspektion"` (rad 4712)
- `"mina fakturor" / "visa fakturor"` (rad 4713)
- `"dashboard" / "sammanfattning" / "översikt"` (rad 4714)

Behåll alla formulärvägar som har förhandsval (offert, tid, dagrapport, arbetsorder, checka in, kund, projekt, planering, uppdatera projekt).

#### 3. Rensa `<tools_quick_ref>`
Ta bort raden `ÖVERSIKT: get_dashboard_summary` som egen kategori.
Ta bort `search_customer_invoices`, `search_vendor_invoices`, `search_inspections` från SÖKA.
Ta bort `create_inspection` från SKAPA.

Ny version:
```
SÖKA: search_customers, search_projects, search_estimates, search_work_orders, search_ata
SKAPA: create_work_order, create_ata, create_plan, create_estimate, create_project, register_time, create_daily_report
VISA: get_project, get_customer, get_estimate, get_project_economy, get_project_overview, get_project_plan, list_project_files, get_dashboard_summary
FORMULÄR: get_projects_for_work_order, get_active_projects_for_time, get_customers_for_estimate, get_projects_for_daily_report, get_projects_for_check_in, get_customer_form, get_project_form, get_projects_for_planning, get_projects_for_update
UPPDATERA: update_work_order, update_ata, update_customer, update_project
NÄRVARO: generate_attendance_qr, check_in, check_out
```

(`get_dashboard_summary` flyttas till VISA-raden, inspektioner och fakturasökning tas bort.)

Verktygen finns kvar och fungerar fortfarande om användaren ber om dem -- de nämns bara inte proaktivt.

### Filändringar

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Uppdatera role, form_policy och tools_quick_ref |

