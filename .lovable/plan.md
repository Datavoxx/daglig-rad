

## Tre rollnivåer: founder, admin, arbetare

### Sammanfattning
Lägger till en tredje roll (`founder`) i systemet men behåller AI-användning kopplat till `mahad@datavoxx.se` som det redan är. Fokus ligger på att strukturera rollerna korrekt.

### Tre roller

| Roll | Vem | Hur de skapas |
|------|-----|---------------|
| **founder** | Dig (tilldelar manuellt i databasen) | Manuellt via SQL |
| **admin** | Chefer som registrerar konto | Automatiskt vid registrering |
| **user** | Arbetare som bjuds in via länk | Automatiskt vid accepterad inbjudan |

### Ändringar

#### 1. Databasmigrering (SQL)
- Lägg till `'founder'` i `app_role`-enumen
- Uppdatera `handle_new_user()`-funktionen: ändra default-rollen från `'user'` till `'admin'` (alla som registrerar sig själva är chefer)

#### 2. Accept-invitation (Edge Function)
**Fil: `supabase/functions/accept-invitation/index.ts`**
- Efter att kontot skapats: uppdatera rollen i `user_roles` från `'admin'` (som triggern sätter) till `'user'` (arbetare)

#### 3. useUserPermissions
**Fil: `src/hooks/useUserPermissions.ts`**
- Lägg till hantering av `founder`-rollen -- founders behandlas som admins med full modulåtkomst

#### 4. AI-användning
- **Ingen ändring** -- behålls som det är, kopplat till `mahad@datavoxx.se`

### Manuell tilldelning av founder
Du tilldelar founder-rollen i databasen:
```text
UPDATE user_roles SET role = 'founder' WHERE user_id = '<ditt-user-id>';
```

### Filändringar

| Fil | Ändring |
|-----|---------|
| SQL-migrering | `ALTER TYPE app_role ADD VALUE 'founder'`, uppdatera `handle_new_user()` |
| `supabase/functions/accept-invitation/index.ts` | Ändra roll till `'user'` efter kontoskapande |
| `src/hooks/useUserPermissions.ts` | Hantera `founder` som full-access |

