

## Fixa befintliga roller och lägg till namn i user_roles

### Problem
1. Alla 10 befintliga konton har rollen `user` trots att triggern nu sätter `admin` för nya
2. Tabellen `user_roles` saknar ett namnfält

### Åtgärder

#### 1. Databasmigrering (SQL)

**Lägg till `name`-kolumn i `user_roles`:**
- Ny kolumn `name TEXT` (nullable, fylls i från profiles-tabellen)

**Uppdatera befintliga roller:**
- Sätt alla konton till `admin` UTOM de två som är länkade arbetare (`linked_user_id` i employees-tabellen)
- De två arbetarna (`mahad.abdullahi1@outlook.com`, `mmagenzy.info@gmail.com`) behåller `user`-rollen
- Fyll i `name`-kolumnen från `profiles.full_name` för alla befintliga rader

**Uppdatera `handle_new_user()`-triggern:**
- Inkludera `name` (från `full_name` i user metadata) vid insättning i `user_roles`

#### 2. Accept-invitation (Edge Function)
- Inkludera anställdas namn i `user_roles` vid kontoskapande

### Vilka får vilken roll

| Konto | Roll |
|-------|------|
| mahad@datavoxx.se (Isak Holmberg) | admin |
| alvin@jiaab.se | admin |
| info@datavoxx.se | admin |
| philipruan0306@gmail.com | admin |
| isak@jiaab.se | admin |
| test@test.com | admin |
| sugrow18@gmail.com | admin |
| developer@datavoxx.se | admin |
| mahad.abdullahi1@outlook.com | user (arbetare) |
| mmagenzy.info@gmail.com | user (arbetare) |

### Filändringar

| Fil | Ändring |
|-----|---------|
| SQL-migrering | Lägg till `name`-kolumn, uppdatera roller, uppdatera trigger |
| `supabase/functions/accept-invitation/index.ts` | Inkludera namn vid roll-insättning |

