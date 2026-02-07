

## Problem

Dagrapporter (`/daily-reports`) är blockerade för administratörer eftersom modulen `"daily-reports"` saknas i deras `user_permissions`-data i databasen.

### Rotorsak

| Plats | Värde |
|-------|-------|
| `ALL_MODULES` i kod | Inkluderar `"daily-reports"` |
| Befintliga användare i DB | `[dashboard, projects, estimates, customers, guide, settings, invoices, time-reporting, attendance]` - **saknar `daily-reports`** |

Koden använder bara `ALL_MODULES` om användaren **saknar** en rad i `user_permissions`. Om en rad finns läses den direkt - utan att lägga till nya moduler.

---

## Lösning

### Steg 1: Uppdatera befintliga användare i databasen

Lägg till `"daily-reports"` och `"payroll-export"` till alla administratörers permissions:

```sql
-- Lägg till saknade moduler för admins som har permissions men saknar daily-reports
UPDATE user_permissions
SET modules = array_append(modules, 'daily-reports')
WHERE NOT ('daily-reports' = ANY(modules))
  AND 'dashboard' = ANY(modules);  -- Endast admins (har dashboard)

-- Lägg även till payroll-export om det saknas
UPDATE user_permissions  
SET modules = array_append(modules, 'payroll-export')
WHERE NOT ('payroll-export' = ANY(modules))
  AND 'dashboard' = ANY(modules);
```

### Steg 2: Uppdatera koden för framtida säkerhet

Ändra `useUserPermissions.ts` så att admins alltid får alla moduler, oavsett vad som finns i databasen:

```typescript
// I useUserPermissions.ts, rad 59-68

// Gammal logik:
} else if (!data || !data.modules || data.modules.length === 0) {
  setPermissions(ALL_MODULES);
} else {
  setPermissions(data.modules);  // <- Problemet: använder gamla data
}

// Ny logik:
} else if (!data || !data.modules || data.modules.length === 0) {
  setPermissions(ALL_MODULES);
} else {
  // Säkerställ att nya moduler alltid finns för admins
  if (data.modules.includes("dashboard")) {
    // Admin: använd ALL_MODULES som fallback
    const mergedModules = [...new Set([...ALL_MODULES, ...data.modules])];
    setPermissions(mergedModules);
  } else {
    setPermissions(data.modules);
  }
}
```

Alternativt: **Enklare lösning** - ge admins alltid `ALL_MODULES` om de har `dashboard`:

```typescript
} else {
  // Om användaren har dashboard-access (admin) → ge full åtkomst
  if (data.modules.includes("dashboard")) {
    setPermissions(ALL_MODULES);
  } else {
    setPermissions(data.modules);
  }
}
```

---

## Filer att ändra

| Åtgärd | Beskrivning |
|--------|-------------|
| **Databasmigrering** | Lägg till `daily-reports` och `payroll-export` till befintliga admins |
| `src/hooks/useUserPermissions.ts` | Ge admins full åtkomst till alla moduler automatiskt |

---

## Tekniska detaljer

### Innan fix
- Admin försöker gå till `/daily-reports`
- `hasAccess("daily-reports")` → `false` (saknas i DB)
- `ProtectedModuleRoute` blockerar och redirectar

### Efter fix
- Admin försöker gå till `/daily-reports`  
- `hasAccess("daily-reports")` → `true` (ALL_MODULES används)
- Sidan laddas korrekt

---

## Resultat

- Alla administratörer får automatiskt åtkomst till dagrapporter
- Framtida nya moduler läggs automatiskt till för admins
- Anställda påverkas inte (de har separat logik)

