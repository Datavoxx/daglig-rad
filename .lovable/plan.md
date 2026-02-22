

## Byt loading-animation till Byggio-logga

### Vad som gors

Skapar en ny `ByggioLoader`-komponent med den uppladdade Byggio-loggan och en premium loading-animation (puls + fade + subtil scale), liknande stora appar som Slack, Notion och Figma.

### Scope

Byter **helskarmsladdningar** (ProtectedRoute, ProtectedModuleRoute, och liknande sidladdningar) -- INTE knappar/inline-spinners som ska forbli sma Loader2-ikoner.

### Tekniska steg

1. **Kopiera loggan** till `src/assets/byggio-loader-logo.png`

2. **Skapa `src/components/shared/ByggioLoader.tsx`**
   - Centrerad fullskarms-vy med Byggio-loggan
   - Animation: loggan pulserar mjukt (scale 0.95-1.05 + opacity 0.6-1.0) med en subtil shimmer/glow-effekt
   - Valfri liten "Laddar..."-text under loggan med fade-animation

3. **Uppdatera foljande filer** att anvanda `ByggioLoader` istallet for `Loader2` spinner:
   - `src/components/auth/ProtectedRoute.tsx` (helskarm vid auth-check)
   - `src/components/auth/ProtectedModuleRoute.tsx` (helskarm vid behorighets-check)
   - Ovriga sidor med helskarmsladdning (t.ex. `ProjectView`, `Estimates`, `Dashboard` etc.) dar `Loader2` anvands i en centrerad fullskarmsvy

Knappar och inline-spinners (t.ex. "Sparar...") behalls som `Loader2`.

