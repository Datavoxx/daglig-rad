
# Plan: Ta bort alla återstående toast-notifieringar (del 2)

## Sammanfattning

Fortsätter borttagningen av toast-notifieringar från de återstående ~52 filerna i applikationen.

## Filer att modifiera

### Grupp 1: Sonner-toasts (37 filer)

| Fil | Antal toasts |
|-----|-------------|
| `src/pages/AttendanceScan.tsx` | 4 |
| `src/pages/Invoices.tsx` | 4 |
| `src/pages/PayrollExport.tsx` | Flera |
| `src/pages/Customers.tsx` | Flera |
| `src/pages/TimeReporting.tsx` | Flera |
| `src/components/attendance/QRCodeGenerator.tsx` | 2 |
| `src/components/attendance/AttendanceHistory.tsx` | Flera |
| `src/components/attendance/AttendanceEmployeeView.tsx` | Flera |
| `src/components/estimates/EstimateSummary.tsx` | 2 |
| `src/components/estimates/CreateTemplateDialog.tsx` | 4 |
| `src/components/estimates/EstimateBuilder.tsx` | Flera |
| `src/components/estimates/TemplateEditor.tsx` | 5 |
| `src/components/projects/ProjectDiaryTab.tsx` | Flera |
| `src/components/invoices/VendorInvoiceDialog.tsx` | Flera |
| `src/components/invoices/CustomerInvoiceDialog.tsx` | Flera |
| `src/components/invoices/VendorInvoiceUpload.tsx` | Flera |
| `src/components/invoices/VendorInvoiceList.tsx` | 4 |
| `src/components/invoices/CustomerInvoiceList.tsx` | 4 |
| `src/components/settings/TemplateManager.tsx` | Flera |
| `src/components/settings/SalaryTypeManager.tsx` | 9 |
| `src/components/customers/CustomerFormDialog.tsx` | Flera |
| `src/components/customers/CustomerImportDialog.tsx` | Flera |
| `src/components/customers/CustomerDetailSheet.tsx` | Flera |
| `src/components/time-reporting/AttestationView.tsx` | Flera |
| Och fler... | |

### Grupp 2: Radix UI Toast / useToast (18 filer)

| Fil | Antal toasts |
|-----|-------------|
| `src/pages/InspectionView.tsx` | Flera |
| `src/pages/Estimates.tsx` | Flera |
| `src/pages/Settings.tsx` | Flera |
| `src/pages/InspectionNew.tsx` | Flera |
| `src/pages/Projects.tsx` | Flera |
| `src/pages/ReportView.tsx` | Flera |
| `src/components/reports/ReportEditor.tsx` | Flera |
| `src/components/projects/ProjectPlanningTab.tsx` | 8 |
| `src/components/projects/ProjectOverviewTab.tsx` | 4 |
| `src/components/projects/ProjectFilesTab.tsx` | Flera |
| `src/components/projects/ProjectAtaTab.tsx` | Flera |
| `src/components/projects/AtaFollowUpDialog.tsx` | 4 |
| `src/components/onboarding/CompanyOnboardingWizard.tsx` | Flera |
| `src/components/estimates/EstimateWizard.tsx` | Flera |
| Och fler... | |

## Teknisk implementering

### För Sonner-toasts

**Före:**
```typescript
import { toast } from "sonner";

const handleSave = async () => {
  try {
    await saveData();
    toast.success("Sparat!");
  } catch (error) {
    toast.error("Kunde inte spara");
  }
};
```

**Efter:**
```typescript
const handleSave = async () => {
  try {
    await saveData();
    // Toast borttagen
  } catch (error) {
    console.error("Save failed:", error);
  }
};
```

### För Radix UI Toast (useToast)

**Före:**
```typescript
import { useToast } from "@/hooks/use-toast";

function Component() {
  const { toast } = useToast();
  
  const handleAction = () => {
    toast({ title: "Sparat!" });
  };
}
```

**Efter:**
```typescript
function Component() {
  const handleAction = () => {
    // Toast borttagen
  };
}
```

## Uppdelning av arbetet

Jag kommer att uppdatera filerna i omgångar:

1. **Omgång 1**: Inställningar och projekthantering
   - `SalaryTypeManager.tsx`, `TemplateManager.tsx`
   - `ProjectPlanningTab.tsx`, `ProjectOverviewTab.tsx`, `ProjectFilesTab.tsx`
   - `ProjectAtaTab.tsx`, `AtaFollowUpDialog.tsx`, `ProjectDiaryTab.tsx`

2. **Omgång 2**: Fakturor och kunder
   - `Invoices.tsx`, `VendorInvoiceList.tsx`, `CustomerInvoiceList.tsx`
   - `VendorInvoiceDialog.tsx`, `CustomerInvoiceDialog.tsx`, `VendorInvoiceUpload.tsx`
   - `CustomerFormDialog.tsx`, `CustomerImportDialog.tsx`, `CustomerDetailSheet.tsx`

3. **Omgång 3**: Offerter och tidrapportering
   - `EstimateSummary.tsx`, `CreateTemplateDialog.tsx`, `EstimateBuilder.tsx`
   - `TemplateEditor.tsx`, `EstimateWizard.tsx`, `Estimates.tsx`
   - `TimeReporting.tsx`, `AttestationView.tsx`, `PayrollExport.tsx`

4. **Omgång 4**: Närvaro och egenkontroller
   - `AttendanceScan.tsx`, `QRCodeGenerator.tsx`, `AttendanceHistory.tsx`
   - `AttendanceEmployeeView.tsx`
   - `InspectionView.tsx`, `InspectionNew.tsx`, `Inspections.tsx`

5. **Omgång 5**: Rapporter och övriga
   - `ReportEditor.tsx`, `ReportView.tsx`, `DailyReports.tsx`
   - `Projects.tsx`, `Settings.tsx`, `Guide.tsx`, `Planning.tsx`
   - `CompanyOnboardingWizard.tsx`, `TrainingBookingDialog.tsx`

## Resultat

- Alla popup-notifieringar tas bort
- Felhantering behålls via `console.error`
- Appen blir helt "tyst" utan störande meddelanden
- Logiken i appen fungerar precis som innan
