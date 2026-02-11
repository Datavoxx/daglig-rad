

## Flytta "Offert" i sidomenyn

Ändra ordningen i navigeringen så att "Offert" hamnar direkt under "Byggio AI" och ovanför "Projekt".

### Nuvarande ordning (admin)
1. Hem
2. Byggio AI
3. Projekt
4. Personalliggare
5. Tidsrapport
6. Löneexport
7. **Offert**
8. Fakturor
9. Kunder
10. Inställningar
11. Guide

### Ny ordning
1. Hem
2. Byggio AI
3. **Offert**
4. Projekt
5. Personalliggare
6. Tidsrapport
7. Löneexport
8. Fakturor
9. Kunder
10. Inställningar
11. Guide

### Teknisk ändring

**Fil:** `src/components/layout/AppLayout.tsx`

Flytta raden med `Offert` i `getNavItems`-arrayen (admin-delen) från position 7 till position 3, direkt efter "Byggio AI".

