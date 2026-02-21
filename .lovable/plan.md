

## Ny "Kvitto"-flik i Fakturor

### Oversikt
Lagga till en ny flik "Kvitto" mellan "Leverantorsfakturor" och "Bokforing" pa fakturasidan. Funktionen lat anvandare ta bild pa kvitton (kameran oppnas direkt pa mobil), AI extraherar data (butik, artiklar, moms-uppdelning per momssats), och kvittot sparas i databasen.

### Kvittots datastruktur (baserat pa exempelkvittot)
Fran det uppladdade kvittot (Kronans Apotek) kan vi se strukturen:

- **Butik/leverantor**: Kronans Apotek
- **Org.nr**: 5567872048
- **Datum**: 26-02-13 10:08
- **Kvittonummer**: 000016141500003471
- **Artikelrader**: Beskrivning + belopp + momssats per rad
- **Momsuppdelning**: Tabell med Moms%, Netto, Moms, Belopp (t.ex. 0%, 25%, 12%)
- **Totalt**: 454,99 kr
- **Betalmetod**: VISA/MC

### Angreppssatt

#### 1. Databastabell `receipts`
Ny tabell med kolumner anpassade for kvitton:

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid PK | |
| user_id | uuid | Agarens ID |
| store_name | text | Butik/leverantor |
| org_number | text | Organisationsnummer |
| receipt_number | text | Kvittonummer |
| receipt_date | date | Datum pa kvittot |
| payment_method | text | VISA/MC, Swish etc. |
| project_id | uuid FK | Kopplat projekt |
| items | jsonb | Artikelrader |
| vat_breakdown | jsonb | Momsuppdelning (per momssats) |
| total_ex_vat | numeric | Totalt exkl. moms |
| total_vat | numeric | Total moms |
| total_inc_vat | numeric | Totalt inkl. moms |
| image_storage_path | text | Sökväg till bilden |
| original_file_name | text | Filnamn |
| ai_extracted | boolean | Om AI anvants |
| status | text | new/reviewed |
| created_at, updated_at | timestamptz | |

RLS-policies identiska med vendor_invoices (CRUD pa egna rader).

#### 2. Edge Function `extract-receipt`
Ny edge function som tar emot en bild (base64) och anvander Gemini 2.5 Flash (snabbt + billigt for kvitton) for att extrahera:

```text
{
  "store_name": "Kronans Apotek",
  "org_number": "5567872048",
  "receipt_number": "000016141500003471",
  "receipt_date": "2026-02-13",
  "payment_method": "VISA/MC",
  "items": [
    { "description": "Expedition 1614C05528 fo", "amount": 94.99, "vat_rate": 0 },
    { "description": "Hylo Night forp", "amount": 165.00, "vat_rate": 25 },
    { "description": "BEROCCA ENERGY ORANG for", "amount": 195.00, "vat_rate": 12 }
  ],
  "vat_breakdown": [
    { "vat_rate": 0, "net_amount": 94.99, "vat_amount": 0, "total": 94.99 },
    { "vat_rate": 25, "net_amount": 132.00, "vat_amount": 33.00, "total": 165.00 },
    { "vat_rate": 12, "net_amount": 174.11, "vat_amount": 20.89, "total": 195.00 }
  ],
  "total_ex_vat": 401.10,
  "total_vat": 53.89,
  "total_inc_vat": 454.99
}
```

#### 3. Frontend-komponenter

**`src/components/invoices/ReceiptList.tsx`** -- Listar sparade kvitton (samma monster som VendorInvoiceList).

**`src/components/invoices/ReceiptUploadDialog.tsx`** -- Dialog for att ladda upp kvitto:
- Pa mobil: `<input type="file" accept="image/*" capture="environment">` -- detta oppnar kameran direkt pa telefonen.
- Nar bild valjs/tas -> skickas direkt till AI-extraktion (inget extra klick).
- Visar extraherad data: butik, datum, artiklar, momsuppdelning, totaler.
- Projektval (valfritt).
- Spara-knapp.

**`src/components/invoices/ReceiptDetailDialog.tsx`** -- Visa/redigera sparade kvitton.

#### 4. Andring i `src/pages/Invoices.tsx`
- Lagg till fjarde flik "Kvitto" med Receipt-ikon mellan leverantorsfakturor och bokforing.
- `grid-cols-3` andras till `grid-cols-4`.

### Filandringar

| Fil | Andring |
|-----|---------|
| SQL migration | Skapa `receipts`-tabell + RLS-policies |
| `supabase/functions/extract-receipt/index.ts` | Ny edge function for kvitto-AI-extraktion |
| `src/components/invoices/ReceiptList.tsx` | Ny komponent: lista kvitton |
| `src/components/invoices/ReceiptUploadDialog.tsx` | Ny komponent: ladda upp/fotografera kvitto |
| `src/components/invoices/ReceiptDetailDialog.tsx` | Ny komponent: visa/redigera kvitto |
| `src/pages/Invoices.tsx` | Lagg till "Kvitto"-flik |

