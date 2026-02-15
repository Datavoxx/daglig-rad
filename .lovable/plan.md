

## Fix: Visa lösenordsformuläret direkt vid recovery-länk

### Problem
Recovery-token i URL-hashen (`#access_token=...&type=recovery`) fångas inte korrekt av `PASSWORD_RECOVERY`-eventet, troligen på grund av en race condition eller att hashen stripas under redirect via custom domain. Resultatet blir att vanliga inloggningssidan visas istället.

### Lösning

**Fil: `src/pages/Auth.tsx`** -- Uppdatera useEffect (rad 42-51)

Lägg till en fallback som direkt parsar URL-hashen efter `type=recovery`. Om den hittas, aktiveras recovery-läget oavsett om Supabase-eventet hinner firas eller inte.

```typescript
useEffect(() => {
  // Fallback: check URL hash directly for recovery token
  const hash = window.location.hash;
  if (hash && hash.includes("type=recovery")) {
    setIsRecoveryMode(true);
  }

  // Also listen for the Supabase PASSWORD_RECOVERY event
  supabase.auth.getSession();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setIsRecoveryMode(true);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

### Teknisk sammanfattning

| Ändring | Fil | Vad |
|---------|-----|-----|
| Lägg till URL-hash-fallback | `src/pages/Auth.tsx` | Parsar `type=recovery` från hash-fragmentet som backup |

En liten tillägg i useEffect -- befintlig logik behålls som den är.

