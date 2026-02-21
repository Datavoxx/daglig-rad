
## Dölj snabbknappar på mobilvy

### Vad ändras
De snabbknapparna ("Ny offert", "Tidrapport", etc.) med dropdown-menyer som visas under "Här är din översikt för idag" ska döljas på mobil (under 768px) och bara visas på iPad/dator.

### Teknisk ändring

**`src/pages/Dashboard.tsx`** (rad 330)

Lägg till `hidden md:flex` på wrapper-diven:

```
// Från:
<div className="flex flex-wrap gap-2">

// Till:
<div className="hidden md:flex flex-wrap gap-2">
```

`md:` motsvarar 768px, samma breakpoint som används för mobil/desktop i resten av appen. Knapparna döljs helt på telefon men syns på iPad och dator.

En rad, en fil.
