

## Dölj Löneexport för alla utom mahad@datavox.se

### Vad som ändras

Löneexport-modulen döljs helt från navigering och UI för alla användare utom `mahad@datavox.se`. Ingen databasändring behövs -- detta löses med en enkel e-postkontroll i frontend.

### Tekniska ändringar

#### 1. `src/components/layout/AppLayout.tsx`
- Hämta inloggad användares e-post (finns redan via profil-fetch)
- Filtrera bort "Löneexport" från `visibleNavItems` om e-posten inte är `mahad@datavox.se`

#### 2. `src/pages/TimeReporting.tsx`
- Rad 230-236: Dölj "Löneexport"-knappen om användaren inte är `mahad@datavox.se`
- Kräver en snabb kontroll av `user?.email`

#### 3. `src/App.tsx`
- Routen `/payroll-export` behålls (skyddad av `ProtectedModuleRoute`) men den syns inte i navigeringen för andra användare. Om någon manuellt navigerar dit fungerar modulbehörigheten som vanligt.

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/layout/AppLayout.tsx` | Filtrera bort "Löneexport" från nav om ej mahad@datavox.se |
| `src/pages/TimeReporting.tsx` | Dölj löneexport-knappen om ej mahad@datavox.se |

