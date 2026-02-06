
# Plan: Ta bort alla toast-notifieringar från appen

## Omfattning

Denna ändring tar bort **alla popup-notifieringar (toasts)** från hela applikationen. Detta inkluderar:

- Alla `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()` anrop (Sonner)
- Alla `toast({ title: ... })` anrop (Radix UI Toast)
- Toast-komponenterna själva från App.tsx

## Filer som påverkas

### Röstinspelning och AI
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/hooks/useVoiceRecorder.ts` | 11 stycken (inkl. "Prata nu!", "Transkribering klar!", fel-toasts) |
| `src/components/shared/VoiceInputOverlay.tsx` | 2 stycken |
| `src/components/shared/VoicePromptButton.tsx` | 2 stycken |
| `src/components/estimates/TemplateEditor.tsx` | 5 stycken |
| `src/components/estimates/EstimateSummary.tsx` | Flera |

### Inloggning och registrering
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/pages/Auth.tsx` | 3 stycken (inkl. "Välkommen tillbaka!") |
| `src/pages/Register.tsx` | 4 stycken |
| `src/pages/AcceptInvitation.tsx` | Flera |

### Projekthantering
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/components/projects/ProjectPlanningTab.tsx` | 8 stycken |
| `src/components/projects/ProjectOverviewTab.tsx` | 4 stycken |
| `src/components/projects/AtaFollowUpDialog.tsx` | 4 stycken |
| `src/components/projects/ProjectFilesTab.tsx` | Flera |
| `src/components/projects/InlineDiaryCreator.tsx` | Flera |

### Offerter och mallar
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/hooks/useEstimate.ts` | Flera |
| `src/components/estimates/EstimateImportDialog.tsx` | Flera |
| `src/pages/Estimates.tsx` | Flera |

### Tidrapportering och närvaro
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/pages/TimeReporting.tsx` | Flera |
| `src/pages/Attendance.tsx` | Flera |
| `src/pages/AttendanceScan.tsx` | 4 stycken |
| `src/pages/PayrollExport.tsx` | Flera |
| `src/components/time-reporting/AttestationView.tsx` | Flera |

### Inställningar
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/components/settings/SalaryTypeManager.tsx` | 9 stycken |
| `src/components/settings/ArticleManager.tsx` | Flera |
| `src/components/settings/EmployeeManager.tsx` | Flera |
| `src/components/settings/BillingTypeManager.tsx` | Flera |
| `src/components/settings/TemplateManager.tsx` | Flera |

### Fakturor
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/pages/Invoices.tsx` | 4 stycken |
| `src/components/invoices/VendorInvoiceList.tsx` | 4 stycken |
| `src/components/invoices/CustomerInvoiceList.tsx` | Flera |

### Kunder
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/components/customers/CustomerFormDialog.tsx` | Flera |
| `src/components/customers/CustomerImportDialog.tsx` | Flera |
| `src/components/customers/CustomerDetailSheet.tsx` | Flera |

### Egenkontroller och rapporter
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/pages/Inspections.tsx` | Flera |
| `src/pages/InspectionView.tsx` | Flera |
| `src/pages/InspectionNew.tsx` | Flera |
| `src/components/reports/ReportEditor.tsx` | Flera |
| `src/pages/ReportView.tsx` | Flera |
| `src/pages/DailyReports.tsx` | Flera |

### Övriga
| Fil | Toasts att ta bort |
|-----|-------------------|
| `src/pages/Guide.tsx` | Flera |
| `src/pages/Planning.tsx` | Flera |
| `src/pages/Projects.tsx` | Flera |
| `src/components/onboarding/CompanyOnboardingWizard.tsx` | Flera |
| `src/components/landing/TrainingBookingDialog.tsx` | 2 stycken |
| `src/components/attendance/AttendanceHistory.tsx` | Flera |
| `src/components/auth/ProtectedModuleRoute.tsx` | 1 stycken |

### App-komponenter att ändra
| Fil | Ändring |
|-----|---------|
| `src/App.tsx` | Ta bort `<Toaster />` och `<SonnerToaster />` komponenter |

## Implementationsstrategi

1. **Steg 1**: Ta bort toast-importer och anrop från alla filer (ca 60 filer)
2. **Steg 2**: Ta bort `<Toaster />` och `<SonnerToaster />` från `App.tsx`
3. **Steg 3**: Behåll toast-komponentfilerna (`src/components/ui/toast.tsx`, etc.) ifall de behövs i framtiden

## Tekniska detaljer

### Metod för borttagning

För varje fil:
1. Ta bort `import { toast } from "sonner"` eller `import { useToast } from "@/hooks/use-toast"`
2. Ta bort `const { toast } = useToast()` deklarationer
3. Ta bort alla `toast(...)`, `toast.success(...)`, `toast.error(...)`, `toast.info(...)` anrop
4. Behåll resten av logiken (felhantering fungerar fortfarande via console.error)

### Exempel på ändring

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
  } catch (error) {
    console.error("Save failed:", error);
  }
};
```

## Konsekvenser

- **Ingen visuell feedback** för lyckade operationer (spara, ladda upp, etc.)
- **Ingen visuell feedback** för fel (användaren måste titta på UI-förändringar istället)
- Felhantering fortsätter fungera via `console.error` för felsökning
- Appen blir "tystare" och mindre störande

## Uppskattad omfattning

- ~60 filer att modifiera
- ~150+ toast-anrop att ta bort
- Ingen funktionalitet påverkas, bara feedback-popups försvinner
