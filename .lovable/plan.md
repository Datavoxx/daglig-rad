

## Plan: Mobilvy för offertförhandsgranskning och totalsummor

### Sammanfattning

Fixa två problem:
1. **Förhandsgranskningen** - Lägg till CSS-skalning så hela offerten syns på mobilskärmen
2. **StickyTotals** - Visa nedbrytningen (Arb, Mat, UE, Påsl) även på mobil

---

### 1. QuotePreviewSheet - Skalad förhandsgranskning

**Fil:** `src/components/estimates/QuotePreviewSheet.tsx`

**Problem:** Offertinnehållet är för stort för att passa på en mobilskärm. Användaren kan varken se hela offerten eller zooma ut.

**Lösning:** Använd CSS `transform: scale()` för att skala ner hela offert-containern på mobil så att hela dokumentet passar i viewport. Detta ger en "zoomed out"-effekt.

**Teknisk implementation:**

```tsx
// Lägg till en wrapper med scale-transformation på mobil
<ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
  {/* Scaled container for mobile */}
  <div className={cn(
    "origin-top-left",
    isMobile && "transform scale-[0.6] w-[166%]" // 1/0.6 = 166%
  )}>
    {/* PAGE 1 - Main Quote */}
    <div className={cn(
      "bg-white text-black min-h-[297mm] relative",
      isMobile ? "p-6" : "p-8" // Mer padding när skalad
    )}>
      {/* ... befintligt innehåll utan textsize-ändringar ... */}
    </div>
    
    {/* PAGE 2 & 3 ... */}
  </div>
</ScrollArea>
```

**Visuellt resultat på mobil:**

```
┌─────────────────────────────────────┐
│ Förhandsgranska             [X]    │
│ Så här ser offerten ut             │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [LOGO]              Offert     │ │
│ │                     Nr: OFF-... │ │
│ │                                 │ │
│ │ VÅR REFERENS        KUND       │ │
│ │ isak 0707747731     Adam M     │ │
│ │ Datum: 2026-02-03   Jan Wald...│ │
│ │                                 │ │
│ │ Projekt: tony-test             │ │
│ │                                 │ │
│ │ Beskr | Antal | Enhet | Summa  │ │
│ │ ───────────────────────────────│ │
│ │ Fasad | 520   | h     | 260000 │ │
│ │ ...                            │ │
│ └─────────────────────────────────┘ │
│         ↓ Scrolla för mer ↓        │
└─────────────────────────────────────┘
```

**Förklaring av skalningen:**
- `scale-[0.6]` = 60% av originalstorlek
- `w-[166%]` = 100/0.6 ≈ 166% kompenserar för skalningen så contentet fyller hela bredden
- `origin-top-left` = skalningen utgår från övre vänstra hörnet

---

### 2. StickyTotals - Visa nedbrytning på mobil

**Fil:** `src/components/estimates/StickyTotals.tsx`

**Problem:** Mobilvyn visar bara totalsumman och knappar. Nedbrytningen (Arb, Mat, UE, Påsl) döljs med `hidden lg:block`.

**Lösning:** Lägg till en kompakt nedbrytningsrad ovanför totalen på mobil.

**Ändring i mobilsektionen (rad 61-110):**

```tsx
if (isMobile) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      {/* NY: Breakdown row för mobil */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 text-[11px] text-muted-foreground border-b">
        <div className="flex items-center gap-3">
          <span>Arb: <span className="font-medium text-foreground">{formatNumber(laborCost)}</span></span>
          <span>Mat: <span className="font-medium text-foreground">{formatNumber(materialCost)}</span></span>
          <span>UE: <span className="font-medium text-foreground">{formatNumber(subcontractorCost)}</span></span>
          <span>Påsl: <span className="font-medium text-foreground">{formatNumber(markup)}</span></span>
        </div>
      </div>
      
      {/* Befintlig total + knappar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Totalt inkl. moms</p>
          <p className="text-xl font-bold text-primary">
            {formatNumber(hasAnyDeduction ? amountToPay : totalInclVat)} kr
          </p>
          {/* ... */}
        </div>
        {/* Knappar... */}
      </div>
    </div>
  );
}
```

**Visuellt resultat:**

```
FÖRE (bara total):
┌────────────────────────────────────────┐
│ Totalt inkl. moms           [👁] [⬇] [💾▼]│
│ 461 438 kr                             │
└────────────────────────────────────────┘

EFTER (med nedbrytning):
┌────────────────────────────────────────┐
│ Arb: 46 500  Mat: 274 500  UE: 0  Påsl: 48 150 │
├────────────────────────────────────────┤
│ Totalt inkl. moms           [👁] [⬇] [💾▼]│
│ 461 438 kr                             │
└────────────────────────────────────────┘
```

---

### Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/QuotePreviewSheet.tsx` | CSS scale-transformation för att zooma ut offerten på mobil |
| `src/components/estimates/StickyTotals.tsx` | Visa Arb/Mat/UE/Påsl-nedbrytning även på mobil |

---

### Tekniska detaljer

**Scale-transformation:**
- Vi använder `scale(0.6)` för att minska storleken till 60%
- `w-[166%]` kompenserar så att innehållet fortfarande fyller hela bredden
- Användaren kan fortfarande scrolla vertikalt för att se alla sidor
- Ingen information döljs - allt är synligt, bara mindre

**StickyTotals höjd:**
- Före: ~68px
- Efter: ~100px (med extra rad för breakdown)
- Fortfarande kompakt nog för att inte ta för mycket skärmyta

