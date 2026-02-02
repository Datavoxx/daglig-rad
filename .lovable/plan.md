# Plan: Dagrapporter och anställdas åtkomst

## Status: ✅ Implementerat

### Genomförda ändringar

#### 1. RLS-uppdatering för `daily_reports`
- **Migration**: Uppdaterade RLS-policyer för att tillåta anställda att läsa/skriva arbetsgivarens dagrapporter
- **Ny policy**: `auth.uid() = user_id OR user_id = get_employer_id(auth.uid())`

#### 2. Employer-logik i ReportEditor.tsx
- **Ändring**: Vid sparande av rapport kontrolleras om användaren är en anställd
- **Logik**: Om anställd → använd arbetsgivarens ID som `user_id`
- **Resultat**: Rapporter sparas korrekt under arbetsgivarens konto

#### 3. Artikelbiblioteket
- **Status**: Fungerar korrekt - visar artiklar baserat på `user_id = auth.uid()`
- **Åtgärd**: Användaren behöver lägga till artiklar via Inställningar → Artiklar

### Filer som ändrades
| Fil | Ändring |
|-----|---------|
| `supabase/migrations/..._daily_reports_employee_access.sql` | Ny RLS |
| `src/components/reports/ReportEditor.tsx` | Employer-logik vid insert |

### Resultat
- ✅ Anställda kan se arbetsgivarens dagrapporter
- ✅ Anställda kan skapa dagrapporter (kopplas till arbetsgivarens konto)
- ✅ Navigation begränsad till: Personalliggare, Tidsrapport, Dagrapporter
