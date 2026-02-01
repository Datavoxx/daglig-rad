

## Komplett Projektrapport - Lägg till alla saknade delar

### Översikt

Säkerställa att ALLA projektrelaterade data inkluderas i slutrapporten när ett projekt avslutas. Just nu saknas flera viktiga delar.

### Nuläge vs Önskat läge

| Data | Nuläge | Efter |
|------|--------|-------|
| Offertposter | Inkluderas | Inkluderas |
| ÄTA-arbeten | Inkluderas | Inkluderas |
| Projektplanering | Inkluderas | Inkluderas |
| Dagrapporter | Inkluderas | Inkluderas |
| **Tidsrapporter** | Interface finns, **hämtas EJ** | Inkluderas |
| **Arbetsorder** | **Saknas helt** | Inkluderas |
| **Projektfiler** | **Saknas helt** | Lista inkluderas |
| **Leverantörsfakturor** | **Saknas helt** | Inkluderas |

### Teknisk implementation

#### 1. Uppdatera gränssnitt i generateCompleteProjectPdf.ts

Lägg till nya interfaces för de saknade datatyperna:

```typescript
interface WorkOrder {
  id: string;
  order_number: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
}

interface ProjectFile {
  id: string;
  file_name: string;
  category: string | null;
  created_at: string;
}

interface VendorInvoice {
  id: string;
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total_inc_vat: number;
  status: string;
}
```

Uppdatera `CompleteProjectPdfOptions` med nya fält:
- `workOrders: WorkOrder[]`
- `projectFiles: ProjectFile[]`
- `vendorInvoices: VendorInvoice[]`

#### 2. Uppdatera datahämtning i ProjectOverviewTab.tsx

Utöka `handleGenerateCompletePdf` för att hämta alla saknade data:

```typescript
const [
  estimateItemsRes,
  ataItemsRes,
  planRes,
  diaryRes,
  timeEntriesRes,      // NY - tidrapporter
  workOrdersRes,       // NY - arbetsorder
  filesRes,            // NY - projektfiler
  vendorInvoicesRes,   // NY - leverantörsfakturor
  companyRes
] = await Promise.all([
  // ... befintliga queries ...
  
  // Tidrapporter med billing_types join
  supabase.from("time_entries")
    .select(`*, billing_types(name), salary_types(name), profiles(full_name)`)
    .eq("project_id", project.id),
  
  // Arbetsorder
  supabase.from("project_work_orders")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at"),
  
  // Projektfiler (bara metadata, inte själva filerna)
  supabase.from("project_files")
    .select("id, file_name, category, created_at")
    .eq("project_id", project.id)
    .order("created_at"),
  
  // Leverantörsfakturor kopplade till projektet
  supabase.from("vendor_invoices")
    .select("id, supplier_name, invoice_number, invoice_date, total_inc_vat, status")
    .eq("project_id", project.id)
    .order("invoice_date"),
  
  // ... company settings ...
]);
```

#### 3. Uppdatera PDF-generatorn

Lägg till nya sektioner i `generateCompleteProjectPdf`:

**Arbetsorder-sektion:**
```typescript
// === WORK ORDERS ===
if (workOrders.length > 0) {
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Arbetsorder", 14, yPos);
  yPos += 10;

  const workOrderData = workOrders.map((wo) => [
    wo.order_number || "-",
    wo.title,
    wo.assigned_to || "-",
    formatDate(wo.due_date),
    wo.status === "completed" ? "Klar" : 
      wo.status === "in_progress" ? "Pågående" : "Väntande",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Order-nr", "Titel", "Tilldelad", "Förfaller", "Status"]],
    body: workOrderData,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60] },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;
}
```

**Projektfiler-sektion:**
```typescript
// === PROJECT FILES ===
if (projectFiles.length > 0) {
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Projektfiler & bilagor", 14, yPos);
  yPos += 10;

  const filesData = projectFiles.map((f) => [
    f.file_name,
    f.category === "image" ? "Bild" : 
      f.category === "attachment" ? "Bilaga" : "Dokument",
    formatDate(f.created_at),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Filnamn", "Typ", "Uppladdad"]],
    body: filesData,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60] },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;
}
```

**Leverantörsfakturor-sektion:**
```typescript
// === VENDOR INVOICES ===
if (vendorInvoices.length > 0) {
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Leverantörsfakturor", 14, yPos);
  yPos += 10;

  const vendorData = vendorInvoices.map((inv) => [
    inv.supplier_name,
    inv.invoice_number || "-",
    formatDate(inv.invoice_date),
    formatCurrency(inv.total_inc_vat),
    inv.status === "paid" ? "Betald" : 
      inv.status === "approved" ? "Godkänd" : "Ny",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Leverantör", "Faktura-nr", "Datum", "Belopp", "Status"]],
    body: vendorData,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60] },
  });

  // Total leverantörskostnader
  const vendorTotal = vendorInvoices.reduce((sum, inv) => sum + inv.total_inc_vat, 0);
  yPos = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total leverantörskostnad: ${formatCurrency(vendorTotal)}`, 14, yPos);
  yPos += 15;
}
```

#### 4. Uppdatera ekonomisk sammanfattning

Inkludera leverantörskostnader i den ekonomiska översikten:

```typescript
const economyData = [
  ["Offertbelopp (inkl. moms)", formatCurrency(estimateTotal)],
  ["ÄTA-arbeten", formatCurrency(ataTotal)],
  ["Slutsumma intäkter", formatCurrency(grandTotal)],
  ["", ""],
  ["Leverantörskostnader", formatCurrency(vendorTotal)],
  ["Bruttoresultat", formatCurrency(grandTotal - vendorTotal)],
];
```

#### 5. Uppdatera completion-dialogen

Uppdatera listan i dialogen så användaren ser vad som inkluderas:

```typescript
<ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
  <li>Offert med alla poster</li>
  <li>ÄTA-arbeten</li>
  <li>Projektplanering</li>
  <li>Alla dagrapporter</li>
  <li>Tidsrapporter</li>
  <li>Arbetsorder</li>
  <li>Projektfiler & bilagor</li>
  <li>Leverantörsfakturor</li>
  <li>Ekonomisk sammanfattning</li>
</ul>
```

### Filer som påverkas

| Fil | Ändring |
|-----|---------|
| `src/lib/generateCompleteProjectPdf.ts` | Lägg till interfaces och nya PDF-sektioner |
| `src/components/projects/ProjectOverviewTab.tsx` | Hämta alla saknade data + uppdatera dialog-text |

### Fördelar

- **Komplett dokumentation** - Alla projektdata samlas i en professionell PDF
- **Ekonomisk överblick** - Både intäkter och kostnader visas
- **Spårbarhet** - Alla arbetsorder och leverantörsfakturor dokumenteras
- **Arkivering** - Alla uppladdade filer listas för referens

