

## Fixa "Okänd"-problemet i Personalliggare

### Problemet

I "På plats just nu"-sektionen visas **"Okänd"** istället för den anställdas namn. Detta beror på att RLS-policyn på `profiles`-tabellen endast tillåter användare att läsa sin **egen** profil:

```sql
-- Nuvarande policy
USING (auth.uid() = id)
```

När du (admin) försöker hämta profilinfo för dina anställda, blockeras det av RLS och returnerar `null`.

### Lösningen

Lägg till en ny RLS-policy som tillåter arbetsgivare att läsa sina anställdas profiler:

```sql
CREATE POLICY "Employers can view employee profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id  -- Egen profil
    OR 
    EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.linked_user_id = profiles.id 
        AND e.user_id = auth.uid()
        AND e.is_active = true
    )
  );
```

**Logik:**
- `auth.uid() = id` → Du kan läsa din egen profil
- `employees.linked_user_id = profiles.id` → Profilen tillhör en anställd
- `employees.user_id = auth.uid()` → Du är arbetsgivaren
- `employees.is_active = true` → Anställningen är aktiv

### Fil som ändras

| Ändring | Detalj |
|---------|--------|
| Databas-migration | Uppdatera RLS-policy på `profiles` |

### Resultat

Efter denna ändring:
- Admin ser "mahad" istället för "Okänd"
- Alla aktiva anställdas namn visas korrekt i "På plats just nu"
- Initialer i avataren visas också korrekt (t.ex. "M" istället för "?")

