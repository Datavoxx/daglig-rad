

## Åtgärdsplan: Fixa RLS-policy för Admin-registrering av Tid

### Problemet

När en admin försöker registrera tid för en anställd (t.ex. "mahad"), misslyckas det eftersom:
- RLS-policyn kräver att `auth.uid() = user_id` för INSERT
- Men koden sätter `user_id` till den anställdes `linked_user_id`
- Detta bryter mot policyn eftersom admin != anställd

### Lösning

Lägg till en ny RLS-policy som tillåter arbetsgivare att skapa tidsposter för sina anställda.

### Databasändring

```sql
-- Tillåt arbetsgivare att skapa tidsposter för anställda
CREATE POLICY "Employers can insert time entries for employees"
  ON time_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id
  );

-- Tillåt arbetsgivare att uppdatera tidsposter för anställda  
CREATE POLICY "Employers can update employee time entries"
  ON time_entries
  FOR UPDATE
  USING (auth.uid() = employer_id);

-- Tillåt arbetsgivare att ta bort tidsposter för anställda
CREATE POLICY "Employers can delete employee time entries"
  ON time_entries
  FOR DELETE
  USING (auth.uid() = employer_id);
```

### Förklaring

| Scenario | user_id | employer_id | auth.uid() | Resultat |
|----------|---------|-------------|------------|----------|
| Registrera egen tid | admin-id | admin-id | admin-id | OK (befintlig policy) |
| Admin registrerar för anställd | mahad-id | admin-id | admin-id | OK (ny policy) |
| Anställd registrerar egen tid | mahad-id | admin-id | mahad-id | OK (befintlig policy) |

### Sammanfattning

| Typ | Beskrivning |
|-----|-------------|
| Ny RLS-policy | Arbetsgivare kan INSERT/UPDATE/DELETE tidsposter där `employer_id = auth.uid()` |
| Koständringar | Inga - koden är redan korrekt |

### Resultat

- Admin kan registrera tid för sina anställda
- Anställda kan fortfarande registrera sin egen tid
- Säkerheten bibehålls - endast arbetsgivaren kan hantera sina anställdas tidsposter

