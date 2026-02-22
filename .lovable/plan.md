

## Byt alla sidladdnings-spinners till ByggioLoader

### Problem
Flera sidor använder fortfarande `Loader2`-spinnern (den snurrande cirkeln) för sidladdning istället för Byggio-loggan med puls-animation. Det är detta du ser på `/customers`.

### Vad som ändras

Alla **sidladdningar** (stora centrerade spinners) byts till `ByggioLoader`. Knappar och inline-spinners (t.ex. "Sparar...", "Transkriberar...") behålls som `Loader2`.

Filer som uppdateras:

| Fil | Typ av laddning | Ändring |
|-----|-----------------|---------|
| `src/pages/Customers.tsx` (rad 141-145) | Sidladdning | Byt till ByggioLoader |
| `src/pages/AttendanceScan.tsx` (rad 153-157) | Helskärm | Byt till ByggioLoader |
| `src/pages/Profile.tsx` (rad 183-187) | Sidladdning | Byt till ByggioLoader |
| `src/pages/InspectionNew.tsx` (rad 631-633) | Sidladdning | Byt till ByggioLoader |
| `src/pages/DailyReports.tsx` (rad 176-179) | Sektionsladdning | Byt till ByggioLoader |

Knappar som "Sparar...", "Transkriberar...", "Raderar..." etc. behålls som `Loader2` -- de är inline-spinners, inte sidladdningar.

### Tekniskt

- Importera `ByggioLoader` från `@/components/shared/ByggioLoader`
- Ersätt `<div className="flex items-center justify-center ..."><Loader2 .../></div>` med `<ByggioLoader />`
- Ta bort oanvända `Loader2`-importer där det var enda användningen

