
## Implementeringsplan: Fakturor-modulen

### Översikt

Denna plan ersätter den nuvarande "Ekonomi"-sektionen (placeholder) med en komplett "Fakturor"-modul innehållande kundfakturor och leverantörsfakturor.

---

### Del 1: Databasschema

#### Tabell: customer_invoices (Kundfakturor)

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | uuid | Ägare (RLS) |
| invoice_number | text | Löpnummer (INV-2026-0001) |
| customer_id | uuid | FK till customers |
| project_id | uuid | FK till projects |
| status | text | draft / sent / paid |
| invoice_date | date | Fakturadatum |
| due_date | date | Förfallodatum |
| rows | jsonb | Fakturarader |
| total_ex_vat | numeric | Summa exkl moms |
| vat_amount | numeric | Momsbelopp |
| total_inc_vat | numeric | Summa inkl moms |
| payment_terms | text | Betalvillkor |
| notes | text | Interna anteckningar |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### Tabell: vendor_invoices (Leverantörsfakturor)

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | uuid | Ägare (RLS) |
| supplier_name | text | Leverantörsnamn |
| project_id | uuid | FK till projects |
| status | text | new / reviewed / attested |
| invoice_number | text | Leverantörens fakturanr |
| invoice_date | date | |
| due_date | date | |
| rows | jsonb | Extraherade rader |
| total_ex_vat | numeric | |
| vat_amount | numeric | |
| total_inc_vat | numeric | |
| pdf_storage_path | text | Sökväg i storage |
| original_file_name | text | Ursprungligt filnamn |
| ai_extracted | boolean | Om AI extraherade data |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### RLS-policyer
- Samma mönster som befintliga tabeller: `auth.uid() = user_id`
- SELECT, INSERT, UPDATE, DELETE för ägaren

#### Ny Storage Bucket
- `invoice-files` (public) för leverantörsfaktura-PDFer

---

### Del 2: Navigation och Routing

#### Ändringar i AppLayout.tsx
```typescript
// Ersätt:
{ label: "Ekonomi", href: "/economy", icon: Landmark, moduleKey: "economy" }

// Med:
{ label: "Fakturor", href: "/invoices", icon: FileText, moduleKey: "invoices" }
```

#### Ändringar i App.tsx
```typescript
// Ersätt /economy med /invoices
<Route path="/invoices" element={<ProtectedModuleRoute module="invoices"><Invoices /></ProtectedModuleRoute>} />
```

#### Uppdatera user_permissions
- Ersätt "economy" med "invoices" i handle_new_user()-funktionen

---

### Del 3: Sidstruktur

```text
src/pages/Invoices.tsx                     # Huvudsida med flikar
src/components/invoices/
├── CustomerInvoiceList.tsx                # Lista kundfakturor
├── CustomerInvoiceForm.tsx                # Skapa/redigera kundfaktura
├── CustomerInvoiceDialog.tsx              # Dialog wrapper
├── VendorInvoiceList.tsx                  # Lista leverantörsfakturor
├── VendorInvoiceUpload.tsx                # Ladda upp med AI-extraktion
├── VendorInvoiceDialog.tsx                # Granska/redigera extraherad faktura
└── InvoiceRowEditor.tsx                   # Återanvändbar radeditor
src/lib/generateCustomerInvoicePdf.ts      # PDF-generering
```

---

### Del 4: UI-flöden

#### 4.1 Kundfakturor - Listvy

```text
┌─────────────────────────────────────────────────────────────┐
│ Fakturor                                                    │
│ ─────────────────────────────────────────────────────────── │
│ [Kundfakturor] [Leverantörsfakturor]                        │
│                                                             │
│ [Statusfilter ▼] [Sök...]           [+ Ny kundfaktura]      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INV-2026-0001 │ Andersson AB │ Projekt X │ 125 000 kr   │ │
│ │ 2026-02-01    │                          │ [Skickad]    │ │
│ │                                 [PDF] [Öppna] [Betald?] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INV-2026-0002 │ Johansson     │ Projekt Y │ 45 000 kr   │ │
│ │ 2026-02-01    │                          │ [Utkast]     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2 Skapa kundfaktura

Steg 1: Välj projekt/kund
```text
┌─────────────────────────────────────────────┐
│ Ny kundfaktura                              │
│                                             │
│ Projekt: [Sök projekt... ▼]                 │
│ (Auto-fyller kund om kopplat)               │
│                                             │
│ Kund: [Andersson AB]                        │
│                                             │
│ [ ] Hämta rader från offert                 │
│ [ ] Inkludera godkända ÄTA                  │
└─────────────────────────────────────────────┘
```

Steg 2: Fakturarader
```text
┌──────────────────────────────────────────────────────────┐
│ Rader                                                    │
│ ┌─────────────────┬───────┬───────┬────────┬───────────┐ │
│ │ Beskrivning     │ Antal │ Enhet │ Á-pris │ Summa     │ │
│ ├─────────────────┼───────┼───────┼────────┼───────────┤ │
│ │ Snickeriarbeten │ 40    │ h     │ 520    │ 20 800 kr │ │
│ │ Material        │ 1     │ st    │ 15000  │ 15 000 kr │ │
│ │ [+ Lägg till rad]                                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Fakturadatum: [2026-02-01]  Förfallo: [2026-03-03]       │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│ Summa exkl moms:                         35 800 kr      │
│ Moms 25%:                                 8 950 kr      │
│ TOTALT:                                  44 750 kr      │
│                                                          │
│      [Spara utkast]  [Ladda ner PDF]  [Markera skickad] │
└──────────────────────────────────────────────────────────┘
```

#### 4.3 Leverantörsfakturor - AI-upload

```text
┌────────────────────────────────────────────────┐
│ Lägg till leverantörsfaktura                   │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │     📄 Dra och släpp PDF här             │  │
│  │        eller klicka för att välja        │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [Laddar...] AI analyserar fakturan...         │
│                                                │
└────────────────────────────────────────────────┘

Efter AI-extraktion:

┌────────────────────────────────────────────────────────┐
│ Granska extraherad data                                │
│                                                        │
│ Leverantör: [Byggvaror AB          ] (AI-ifyllt)       │
│ Fakturanr:  [F-12345              ]                    │
│ Datum:      [2026-01-28]  Förfallo: [2026-02-27]       │
│                                                        │
│ Projekt:    [Välj projekt... ▼]                        │
│             💡 Förslag: "Fasadmålning Kungälv"         │
│                                                        │
│ Rader:                                                 │
│ ┌───────────────────────┬───────┬───────┬────────────┐ │
│ │ Beskrivning           │ Antal │ Á-pris│ Summa      │ │
│ ├───────────────────────┼───────┼───────┼────────────┤ │
│ │ Fasadfärg vit 10L     │ 5     │ 890   │ 4 450 kr   │ │
│ │ Grundfärg 5L          │ 3     │ 650   │ 1 950 kr   │ │
│ │ Penslar och roller    │ 1     │ 450   │ 450 kr     │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ Moms 25%:                                  1 713 kr   │
│ TOTALT:                                    8 563 kr   │
│                                                        │
│              [Avbryt]  [Spara faktura]                 │
└────────────────────────────────────────────────────────┘
```

---

### Del 5: Edge Function för AI-extraktion

#### Ny funktion: extract-vendor-invoice

```typescript
// supabase/functions/extract-vendor-invoice/index.ts

// Input: Base64-encoded PDF eller bilddata
// Output: Strukturerad JSON med leverantör, rader, belopp

// Använder Lovable AI (Gemini) för att:
// 1. OCR/tolka PDF-innehåll
// 2. Extrahera leverantörsnamn, fakturanummer, datum
// 3. Identifiera fakturarader med mängd, pris, belopp
// 4. Beräkna/verifiera summor
// 5. Försöka hitta projektreferens i texten
```

---

### Del 6: PDF-generering (Kundfaktura)

#### Ny fil: src/lib/generateCustomerInvoicePdf.ts

Baseras på befintlig `generateQuotePdf.ts` med anpassningar:
- Titel: "FAKTURA" istället för "OFFERT"
- Fakturanummer, kundreferens
- Betalvillkor och förfallodatum
- Bankgiro/betalinfo tydligt
- Ingen signatursida

---

### Del 7: Implementeringsordning

| Steg | Beskrivning | Uppskattad komplexitet |
|------|-------------|------------------------|
| 1 | Databasmigration (tabeller, RLS, bucket) | Medium |
| 2 | Uppdatera navigation (economy -> invoices) | Låg |
| 3 | Grundläggande Invoices.tsx med flikar | Låg |
| 4 | CustomerInvoiceList + CRUD | Medium |
| 5 | CustomerInvoiceForm med radeditor | Medium |
| 6 | PDF-generering för kundfakturor | Medium |
| 7 | VendorInvoiceList + manuell CRUD | Medium |
| 8 | Edge function för AI-extraktion | Hög |
| 9 | VendorInvoiceUpload med AI-integration | Hög |

---

### Tekniska detaljer

#### Fakturanummer-generering
```sql
-- Trigger för automatiskt löpnummer
CREATE OR REPLACE FUNCTION generate_customer_invoice_number()
RETURNS trigger AS $$
DECLARE
  year_count INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    SELECT COUNT(*) + 1 INTO year_count 
    FROM customer_invoices 
    WHERE user_id = NEW.user_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    NEW.invoice_number := 'INV-' || 
      EXTRACT(YEAR FROM NOW())::TEXT || '-' || 
      LPAD(year_count::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Radstruktur (JSONB)
```typescript
interface InvoiceRow {
  id: string;
  description: string;
  quantity: number;
  unit: string;        // "h", "st", "m2", etc.
  unit_price: number;
  vat_rate: number;    // 25 default
  subtotal: number;    // auto-beräknad
}
```

---

### Filer som skapas/ändras

| Fil | Åtgärd |
|-----|--------|
| src/pages/Invoices.tsx | NY |
| src/pages/Economy.tsx | TA BORT |
| src/components/invoices/*.tsx | NY (7 filer) |
| src/lib/generateCustomerInvoicePdf.ts | NY |
| supabase/functions/extract-vendor-invoice/index.ts | NY |
| src/components/layout/AppLayout.tsx | ÄNDRA |
| src/App.tsx | ÄNDRA |
| supabase/config.toml | ÄNDRA |

---

### Sammanfattning

Detta är en stor feature (~1500+ rader kod) som implementeras i steg. Viktigaste prioriteringen:

1. **Kundfakturor först** - Enklare, ger direkt värde
2. **Leverantörsfakturor med manuell input** - Fungerar utan AI
3. **AI-extraktion sist** - "Nice to have" som förbättrar UX

Vill du att jag börjar implementera?
