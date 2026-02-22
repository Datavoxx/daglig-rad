
## Separera Bokforing fran Fakturor och ta bort ringklockan

### Oversikt
Tva andringar:
1. Flytta "Bokforing"-fliken fran Fakturor-sidan till en helt egen sida med egen navigeringslank, placerad direkt under "Guide" i sidomenyn
2. Ta bort ringklockan (Bell-ikonen) fran headern, bade desktop och mobil

### Detaljerade andringar

#### 1. Skapa ny sida: `src/pages/Accounting.tsx`
- Ny sida som innehaller allt innehall fran "Bokforing"-fliken i `Invoices.tsx` (integrationskort for Fortnox/Visma, intresseanmalan-formularet)
- Samma hero-sektion som andra sidor, med `BookOpen`-ikon och titeln "Bokforing"
- Klassen `page-transition` laggs till for konsekvent animation

#### 2. Rensa `src/pages/Invoices.tsx`
- Ta bort "Bokforing"-tabben fran TabsList och dess TabsContent
- Ta bort importer som bara anvandes for bokforingssektionen (`RadioGroup`, `RadioGroupItem`, `Phone`, `Bell` (om oanvand), `BookOpen`, Fortnox/Visma-logotyper, relaterad state)
- Behall kundfakturor, leverantorsfakturor och kvitto-tabbar

#### 3. Uppdatera navigeringen i `src/components/layout/AppLayout.tsx`
- Lagg till "Bokforing" som ny nav-item med `BookOpen`-ikon direkt efter "Guide" i bygg-navigationslistan
- moduleKey setts till "invoices" (samma behorighetsniva som fakturor)
- Ta bort Bell-knappen fran headern (rad ~425-427)
- Ta bort `Bell` fran lucide-react-importen

#### 4. Uppdatera `src/App.tsx`
- Importera nya `Accounting`-sidan
- Lagg till route: `/accounting` med `ProtectedModuleRoute module="invoices"`

#### 5. Uppdatera `src/components/layout/BottomNav.tsx`
- Ingen andring behovs har, da bokforing inte var med i mobilnavigeringen fran borjan

### Filer som andras
| Fil | Andring |
|-----|---------|
| `src/pages/Accounting.tsx` | **Ny fil** - bokforingsinnehall fran Invoices |
| `src/pages/Invoices.tsx` | Ta bort bokforings-tabb och relaterad kod |
| `src/components/layout/AppLayout.tsx` | Lagg till nav-item "Bokforing", ta bort Bell-knappen |
| `src/App.tsx` | Lagg till route for `/accounting` |

### Service-industri-navigering
For service-industri-navigeringen laggs ocksa "Bokforing" till, placerad efter "Instellningar" eller pa lamplig plats.
