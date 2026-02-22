

## Ta bort alla loading-tecken

### Vad som andras

Alla synliga laddningsindikatorer (bade Byggio-loggan och Loader2-spinners) som visas vid sidladdning tas bort. Istallet visas ingenting (tomt) medan sidan laddar. Knappar med inline-spinners (t.ex. "Sparar...") behalls -- de ar inte sidladdningar utan feedback pa knapptryck.

### Filer som andras

**Sidladdningar som byts till tomma/null:**

| Fil | Rad | Nuvarande | Andring |
|-----|-----|-----------|---------|
| `src/components/auth/ProtectedRoute.tsx` | 82 | `<ByggioLoader />` | `return null;` |
| `src/components/auth/ProtectedModuleRoute.tsx` | 26 | `<ByggioLoader />` | `return null;` |
| `src/pages/Customers.tsx` | 141 | `<ByggioLoader />` | `return null;` |
| `src/pages/Profile.tsx` | 184 | `<ByggioLoader />` | `return null;` |
| `src/pages/AttendanceScan.tsx` | 154 | `<ByggioLoader />` | `return null;` |
| `src/pages/Settings.tsx` | 285-289 | Loader2 spinner | `return null;` |
| `src/pages/DailyReports.tsx` | 178 | `<ByggioLoader />` (i rapportlista) | Tomt/null |
| `src/pages/InspectionNew.tsx` | 634 | `<ByggioLoader />` (skapande-steg) | Ta bort, behall bara texten |
| `src/pages/Attendance.tsx` | 167-170 | Loader2 spinner (sektionsladdning) | Tomt |
| `src/components/estimates/ArticleCategorySection.tsx` | 74-78 | Loader2 i card | Tomt |

**Filer som behalls som de ar** (inline knappar med "Sparar...", "Transkriberar..." etc.):
- Alla knappar med Loader2 i Profile, Settings, Planning, PayrollExport, ProjectView, ReportView, InspectionView, Inspections -- dessa ar feedback pa knapptryck, inte sidladdningar.

### Tekniskt

- Ersatt `<ByggioLoader />` och Loader2-wrappers med `return null` eller tom div
- Ta bort oanvanda ByggioLoader-importer
- Komponenten `ByggioLoader.tsx` kan tas bort helt om den inte langre anvands nagonsstans

