
## Plan: Lägg till Tidsrapportering för alla användare

### Problem
Befintliga användare (arbetsgivare) har inte `time-reporting` i sina `user_permissions.modules` eftersom modulen lades till efter att deras konton skapades. Den gamla listan innehöll endast:
```
["dashboard", "projects", "estimates", "customers", "guide", "settings", "economy"]
```

### Lösning
Uppdatera alla befintliga användares behörigheter i databasen för att inkludera `time-reporting`.

---

### Steg 1: SQL-migration

Kör en databasuppdatering som lägger till `time-reporting` till alla användare som saknar den:

```sql
UPDATE user_permissions 
SET modules = modules || '["time-reporting"]'::jsonb
WHERE NOT (modules @> '["time-reporting"]'::jsonb);
```

### Steg 2: Uppdatera databas-triggern

Säkerställ att `handle_new_user`-triggern inkluderar `time-reporting` så framtida användare automatiskt får modulen.

---

### Resultat

| Före | Efter |
|------|-------|
| Klock-ikonen saknas i sidofältet | Tidsrapport syns för alla användare |
| Endast anställda har `time-reporting` | Alla användare har `time-reporting` |

---

### Tekniska detaljer

**Berörd tabell:** `user_permissions`

**Berörd trigger:** `handle_new_user` i `public` schema

**Filer att uppdatera:** Ingen frontend-ändring krävs - navigeringen läser redan från behörigheterna korrekt.
