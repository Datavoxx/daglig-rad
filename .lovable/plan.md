

## Fix: Redirecta lösenordsåterställning till byggio.io

### Problem
När en användare klickar "Återställ lösenord" i mejlet, redirectas de först via Lovables domän innan de kommer till lösenordsformuläret. Användare som inte har Lovable-konto fastnar.

### Lösning

**Fil: `src/pages/Auth.tsx`** (rad ~91)

Ändra `redirectTo` i `resetPasswordForEmail` från `window.location.origin + "/auth"` till en hårdkodad URL med custom domain:

```typescript
// Före:
redirectTo: window.location.origin + "/auth",

// Efter:
redirectTo: "https://byggio.io/auth",
```

Detta gör att Supabase skickar användaren direkt till byggio.io/auth med recovery-token i URL:en, utan att gå via Lovables mellansteg.

### Teknisk sammanfattning

| Ändring | Fil | Rad |
|---------|-----|-----|
| Hårdkoda redirectTo till byggio.io | `src/pages/Auth.tsx` | ~91 |

En rad ändras.
