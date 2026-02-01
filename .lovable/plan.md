

## Implementeringsplan: Ändra Lönetyp till Påslagsprocent

### Vad som ändras

Istället för att ange personalkostnad i kronor per timme, ska lönetypen ange ett **påslag i procent**. Detta gör det enklare att beräkna marginaler och lönsamhet.

**Exempel:**
- Nuvarande: "Snickare" = 450 kr/tim (absolut kostnad)
- Ny modell: "Snickare" = 35% (påslag på debiteringsbeloppet)

---

### Ändringar

#### 1. Databasmigrering

Byt namn på kolumnen och ändra syfte:

```sql
-- Byt från hourly_cost (kr) till markup_percent (%)
ALTER TABLE salary_types 
  RENAME COLUMN hourly_cost TO markup_percent;

-- Sätt standardvärde till rimligt påslag
COMMENT ON COLUMN salary_types.markup_percent IS 'Personalkostnadspåslag i procent';
```

#### 2. Uppdatera SalaryTypeManager.tsx

| Nuvarande | Nytt |
|-----------|------|
| Label: "Personalkostnad (kr/tim)" | Label: "Påslag (%)" |
| Placeholder: "450" | Placeholder: "35" |
| Visning: "450 kr" | Visning: "35%" |
| Kolumnrubrik: "Kostnad" | Kolumnrubrik: "Påslag" |

**Formulärändringar:**
- Ändra input-label från "Personalkostnad (kr/tim)" till "Påslag (%)"
- Ändra placeholder från "450" till "35"
- Validera att värdet är mellan 0-100

**Listvisning:**
- Ändra kolumnrubrik från "Kostnad" till "Påslag"
- Visa värdet med %-tecken istället för "kr"

#### 3. Uppdatera TypeScript-interface

```typescript
// Före
interface SalaryType {
  hourly_cost: number | null;
}

// Efter
interface SalaryType {
  markup_percent: number | null;
}
```

---

### Sammanfattning

| Fil | Ändring |
|-----|---------|
| `supabase/migrations/[ny].sql` | Byt kolumnnamn `hourly_cost` → `markup_percent` |
| `src/components/settings/SalaryTypeManager.tsx` | Uppdatera labels, visning och formdata |

### Resultat

- Lönetyper kommer visa "Snickare - 35%" istället för "Snickare - 450 kr"
- Gör det lättare att räkna marginaler: Om debiteringstyp är 520 kr/tim och påslag är 35%, kan systemet beräkna att personalkostnaden är ~385 kr/tim
- Mer flexibelt för olika projekttyper och debiteringsnivåer

