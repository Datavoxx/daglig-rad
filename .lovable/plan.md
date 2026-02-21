
## Lägg till Byggio-logga centrerat i mobilens topbar

### Vad ändras
En klickbar Byggio-logga placeras centrerat i mobilens topbar (header). Den fungerar som hem-knapp och navigerar till standardrouten. Loggan visas bara på mobil (md och uppåt har redan sidebar-loggan).

### Teknisk ändring

**`src/components/layout/AppLayout.tsx`**

I headern (rad ~285) ändras layouten så att den har tre sektioner: vänster (hamburgare), mitten (logga), höger (klocka/notiser/profil). Loggan visas bara på mobil med `md:hidden`.

```
<header className="flex h-14 items-center justify-between ...">
  {/* Vänster: hamburgare */}
  <div className="flex items-center gap-3">
    {isMobile && ( <Sheet>...</Sheet> )}
    {/* Desktop: Search (oförändrad) */}
  </div>

  {/* NYTT: Centrerad logga - bara mobil */}
  <button
    onClick={() => navigate(getDefaultRoute())}
    className="absolute left-1/2 -translate-x-1/2 md:hidden"
    aria-label="Gå till hem"
  >
    <img src={byggioLogo} alt="Byggio" className="h-8 w-auto" />
  </button>

  {/* Höger: klocka, notiser, profil (oförändrad) */}
  <div className="flex items-center gap-1.5">...</div>
</header>
```

Headern får `relative` tillagt i className så att `absolute left-1/2 -translate-x-1/2` centrerar loggan korrekt. `byggioLogo` importeras redan i filen.

En fil, en liten tillägg.
