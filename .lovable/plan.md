

## Plan: Fixa anställdas navigering - Endast Dagrapporter, Tidsrapport & Personalliggare

### Problem identifierat

Anställda ser fortfarande "Projekt"-sidan av två anledningar:

1. **Edge-funktionen `accept-invitation`** använder `UPDATE` för att sätta behörigheter, men det förutsätter att en rad redan finns i `user_permissions`. Om raden inte skapas korrekt av triggern `handle_new_user`, fungerar inte uppdateringen.

2. **Fallback vid saknad behörighet** går till `/dashboard` eller första modulen, inte `/daily-reports`.

---

### Ändringar som behövs

#### 1. Uppdatera `accept-invitation` Edge Function

Ändra från `UPDATE` till `UPSERT` för att garantera att behörigheter alltid sätts korrekt:

```typescript
// Från:
await supabase
  .from("user_permissions")
  .update({ modules: ["attendance", "time-reporting", "daily-reports"] })
  .eq("user_id", userId);

// Till:
await supabase
  .from("user_permissions")
  .upsert({
    user_id: userId,
    modules: ["attendance", "time-reporting", "daily-reports"]
  }, { onConflict: "user_id" });
```

#### 2. Uppdatera `ProtectedModuleRoute.tsx`

Ändra fallback-logiken så att anställda hamnar på `/daily-reports`:

```typescript
// Istället för att gå till /dashboard som default
// Gå till /daily-reports om det är den första tillgängliga modulen
const fallback = permissions.includes("daily-reports") 
  ? "/daily-reports" 
  : (permissions.length > 0 ? `/${permissions[0]}` : "/dashboard");
```

#### 3. Uppdatera `useUserPermissions.ts`

Ta bort `dashboard` från de standardmoduler som anställda har - de ska endast ha:
- `attendance`
- `time-reporting`
- `daily-reports`

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/accept-invitation/index.ts` | UPSERT istället för UPDATE |
| `src/components/auth/ProtectedModuleRoute.tsx` | Fallback till `/daily-reports` |
| `src/hooks/useUserPermissions.ts` | Verifiera att logiken är korrekt |

---

### Resultat

- Anställda ser **endast**: Dagrapporter, Tidsrapport, Personalliggare
- Anställda ser **INTE**: Projekt, Hem, Offert, Fakturor, Kunder, Inställningar
- Om anställd försöker gå till `/projects` → omdirigeras till `/daily-reports`
- Dagrapporter-sidan låter anställda välja projekt och skriva dagrapporter

