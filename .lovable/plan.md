

## Plan: Kompakt Hero med Dagens Prioriteter

### Nuvarande Problem
Hero-sektionen tar upp mycket plats med en dekorativ hälsning ("Hej, Omar!") som inte ger actionable information. Snabbknapparna replikerar sidomenyn.

### Ny Design: "Dagens Prioriteter"

Ersätt den nuvarande hero-sektionen med en kompakt, alert-fokuserad header:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ Förfallna: 2 fakturor (32 500 kr)    📝 Utkast: 3 att skicka   │
│                                                                     │
│  [Ny offert] [Registrera tid] [Nytt projekt] [Ny faktura]          │
└─────────────────────────────────────────────────────────────────────┘
```

### Teknisk Implementation

**Fil: `src/pages/Dashboard.tsx`**

1. **Ersätt hero-sektionen (rad 294-329)** med en kompakt alert-bar:
   - Ta bort gradient-bakgrund och dekorativa element
   - Visa 2-3 prioriterade alerts horisontellt
   - Behåll snabbknappar i en minimal rad

2. **Alert-prioritering:**
   | Prioritet | Alert | Villkor |
   |-----------|-------|---------|
   | 1 (röd) | Förfallna fakturor | `overdueInvoices > 0` |
   | 2 (amber) | Fakturautkast | `draftInvoices > 0` |
   | 3 (emerald) | Personal på plats | Alltid (info) |

3. **Ny struktur:**
```tsx
<section className="rounded-xl border bg-card/50 p-4">
  {/* Alert chips */}
  <div className="flex flex-wrap items-center gap-3 mb-3">
    {dashboardData?.overdueInvoices > 0 && (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {overdueInvoices} förfallna ({formatCurrency(overdueTotal)})
        </span>
      </div>
    )}
    {dashboardData?.draftInvoices > 0 && (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600">
        <Receipt className="h-4 w-4" />
        <span className="text-sm font-medium">
          {draftInvoices} utkast att skicka
        </span>
      </div>
    )}
    {dashboardData?.activeWorkers.length > 0 && (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
        <UserCheck className="h-4 w-4" />
        <span className="text-sm font-medium">
          {activeWorkers.length} på plats nu
        </span>
      </div>
    )}
  </div>
  
  {/* Quick actions - mer kompakt */}
  <div className="flex flex-wrap gap-2">
    {quickActions.map(...)}
  </div>
</section>
```

4. **Ta bort duplicerad alert-sektion:**
   - Den nuvarande "Draft invoices alert" (rad 471-490) kan tas bort eftersom informationen nu visas i hero-sektionen

### Visuell Jämförelse

| Före | Efter |
|------|-------|
| Stor gradient med hälsning | Kompakt alert-bar |
| "Hej, Omar! 👋" | Actionable data direkt |
| Dekorativa blur-cirklar | Ren, fokuserad design |
| ~120px höjd | ~80px höjd |

### Resultat

- **Snabbare överblick:** Se problem direkt utan att scrolla
- **Mer kompakt:** Sparar vertikal plats för viktigare data
- **Actionable:** Varje alert är klickbar och leder till rätt vy
- **Responsiv:** Chips wrappar snyggt på mobil

