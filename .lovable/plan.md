
## Flytta "Logga ut" till topbar pa mobil

### Vad andras

Pa mobilen laggs en **Logga ut-ikon** (LogOut) i toppmenyn, placerad **mellan ringklockan och profilavataren**. Ordningen blir:

```text
[Klocka]  [Ringklocka]  [Logga ut]  [Profilavatar]
```

### Teknisk andring

**Fil:** `src/components/layout/AppLayout.tsx`

1. **Lagg till en logga ut-knapp i topbar** (mellan Bell-knappen och profilavataren, rad ~401-402), synlig bara pa mobil (`isMobile`):
   - Samma `handleLogoutClick`-funktion som redan finns
   - Samma ikon (`LogOut`) och storlek som ovriga topbar-knappar (`h-9 w-9`)
   - Styling: `variant="ghost"`, destructive-farg for tydlighet

2. **Behall logga ut i hamburgarmenyn** -- den kan finnas pa bada stallena for tillganglighet, eller tas bort fran hamburgarmenyn om du foredrar det

### Resultat

Anvandare pa telefon ser logga ut-ikonen direkt i toppmenyn utan att behova oppna hamburgarmenyn.
