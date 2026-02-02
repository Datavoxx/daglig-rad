
## Plan: Komplett mobilfix för Offert-modulen

### Sammanfattning
Fixa alla mobilproblem i Offert-modulen: offertlistan, header-knappar, EstimateBuilder-header och förhandsgranskningen.

---

### 1. Offertlista - Ny mobiloptimerad kortlayout

**Fil:** `src/pages/Estimates.tsx`

**Problem:** Den nuvarande raden försöker visa för mycket på en rad - projektnamn, kundnamn, datum, offertnummer, badge och delete-knapp.

**Lösning:** Skapa en mobilspecifik kortlayout som visar information på flera rader.

**Ändringar (rad 269-392):**

```tsx
// Lägg till useIsMobile hook
import { useIsMobile } from "@/hooks/use-mobile";

// I komponenten:
const isMobile = useIsMobile();

// Ändra header-sektionen (rad 271-284):
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Offert</h1>
    <p className="text-muted-foreground text-sm">Skapa och hantera offerter</p>
  </div>
  <div className="flex items-center gap-2">
    <EstimateImportDialog ... />
    <Button onClick={() => setShowWizard(true)} size={isMobile ? "sm" : "default"}>
      <Plus className="h-4 w-4 mr-1" />
      {isMobile ? "Ny" : "Ny offert"}
    </Button>
  </div>
</div>

// Ändra offertlistan (rad 304-371) till kortlayout på mobil:
{isMobile ? (
  // MOBIL: Vertikal kortlayout
  <div className="space-y-3">
    {filteredEstimates.map((estimate) => (
      <div
        key={estimate.id}
        onClick={() => handleSelectEstimate(estimate)}
        className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-base">{getEstimateName(estimate)}</p>
            {getClientName(estimate) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {getClientName(estimate)}
              </p>
            )}
          </div>
          <Badge variant={...}>{...}</Badge>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {estimate.offer_number && <span>{estimate.offer_number}</span>}
            <span>•</span>
            <span>{format(new Date(estimate.updated_at), "d MMM", { locale: sv })}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={...}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ))}
  </div>
) : (
  // DESKTOP: Befintlig radlayout
  ...
)}
```

---

### 2. EstimateHeader - Mobiloptimerad layout

**Fil:** `src/components/estimates/EstimateHeader.tsx`

**Problem:** Header-layouten försöker visa för mycket på en rad på mobil. Status badge, offertnummer och version hamnar på samma rad.

**Lösning:** Stackad layout på mobil med tydlig hierarki.

**Ändringar (rad 58-176):**

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

export function EstimateHeader({ ... }) {
  const isMobile = useIsMobile();
  
  // ...existing code...
  
  return (
    <div className="space-y-2">
      {/* Top row: Title area */}
      <div className={cn(
        "gap-3",
        isMobile ? "space-y-2" : "flex items-start justify-between"
      )}>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Offert
            </span>
            <Badge 
              variant={status === "draft" ? "secondary" : "default"}
              className={cn(
                status === "completed" && "bg-green-600 hover:bg-green-700",
                "cursor-pointer"
              )}
              onClick={handleBadgeClick}
            >
              {status === "draft" ? "DRAFT" : "KLAR"}
            </Badge>
          </div>
          {isEditable ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange?.(e.target.value)}
              placeholder="Projektnamn..."
              className="w-full text-xl font-semibold tracking-tight text-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -ml-1"
            />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {projectName}
            </h1>
          )}
        </div>

        {/* Meta info - stacked on mobile */}
        <div className={cn(
          "text-sm",
          isMobile ? "flex items-center gap-2 flex-wrap" : "text-right shrink-0"
        )}>
          <span className="font-medium text-foreground tabular-nums">
            {displayOfferNumber}
          </span>
          <span className="text-muted-foreground">
            v{version} • {displayDate}
          </span>
        </div>
      </div>
      
      {/* ... rest of component */}
    </div>
  );
}
```

---

### 3. QuotePreviewSheet - Fullbredd och responsiv tabell

**Fil:** `src/components/estimates/QuotePreviewSheet.tsx`

**Problem:** 
- Sheeten är för smal för att visa hela offertinnehållet
- Tabellen klipps av på höger sida

**Lösning:** 
- Gör sheeten fullbredd på mobil (`w-full max-w-none`)
- Skala ner PDF-förhandsgranskningen för att passa skärmen
- Använd horisontell scroll för tabellen

**Ändringar (rad 115-322):**

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

export function QuotePreviewSheet({ ... }) {
  const isMobile = useIsMobile();
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={cn(
          "p-0",
          isMobile ? "w-full max-w-none" : "w-full sm:max-w-2xl"
        )}
      >
        {/* ... SheetHeader stays same */}
        
        <ScrollArea className="h-[calc(100vh-100px)]">
          {/* Main quote page with responsive scaling */}
          <div 
            className={cn(
              "bg-white text-black p-6 min-h-[297mm] relative",
              isMobile && "text-sm"
            )}
            style={isMobile ? { fontSize: '12px' } : undefined}
          >
            {/* Responsive table wrapper */}
            <div className={cn(
              "mb-6",
              isMobile && "overflow-x-auto -mx-6 px-6"
            )}>
              <table className="w-full text-sm border-collapse min-w-[500px]">
                {/* ... table content */}
              </table>
            </div>
            
            {/* Footer - responsiv grid */}
            <div className="absolute bottom-8 left-6 right-6 border-t border-gray-300 pt-4">
              <div className={cn(
                "gap-4 text-xs text-gray-600",
                isMobile ? "grid grid-cols-2" : "grid grid-cols-4"
              )}>
                {/* ... footer content */}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
```

---

### 4. EstimateBuilder header - Kompakt mobilversion

**Fil:** `src/components/estimates/EstimateBuilder.tsx`

**Problem:** Header-sektionen med knappar (Tillbaka, Eye, Save, Delete) tar för mycket plats och knappar syns inte.

**Lösning:** Kompaktare header med knappar i en rad som alltid är synlig.

**Ändringar (rad 276-343):**

```tsx
// Uppdaterad header-sektion för mobil
<div className={cn(
  "gap-3",
  isMobile ? "flex flex-col" : "flex items-start justify-between gap-4"
)}>
  {/* Title section */}
  <EstimateHeader
    projectName={displayProjectName}
    clientName={displayClientName}
    address={displayAddress}
    // ... props
  />
  
  {/* Action buttons - always visible on mobile */}
  <div className={cn(
    "flex items-center gap-2",
    isMobile ? "justify-between w-full pb-2 border-b" : "shrink-0"
  )}>
    {onBack && (
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        {isMobile && <span className="ml-1">Tillbaka</span>}
      </Button>
    )}
    <div className="flex items-center gap-1">
      {!isMobile && (
        <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      )}
      <Button size="sm" onClick={handleSaveAsDraft} disabled={estimate.isSaving}>
        {estimate.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </Button>
      {estimate.hasExistingEstimate && (
        <Button variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
</div>
```

---

### 5. AI-avatar på mobil - Responsiv storlek

**Fil:** `src/components/estimates/EstimateBuilder.tsx` (rad 354-357)

**Problem:** Avataren är för stor på mobil (`w-32 h-32` = 128px).

**Lösning:** Responsiv storlek.

```tsx
<img 
  src={AI_AGENTS.estimate.avatar}
  alt="Saga AI"
  className="w-16 h-16 md:w-32 md:h-32 object-contain drop-shadow-lg"
/>
```

---

### Sammanfattning av filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/Estimates.tsx` | Ny mobiloptimerad kortlayout för offertlistan, kortare header-text |
| `src/components/estimates/EstimateHeader.tsx` | Responsiv stackad layout på mobil |
| `src/components/estimates/QuotePreviewSheet.tsx` | Fullbredd på mobil, scrollbar tabell |
| `src/components/estimates/EstimateBuilder.tsx` | Kompaktare header, responsiv avatar-storlek |

---

### Visuellt resultat

**Offertlista - FÖRE:**
```
│📄 Vinterv...  2  D1179 [Klar] 🗑│
│              feb.              │
│              2026              │
```

**Offertlista - EFTER:**
```
┌────────────────────────────────┐
│ Vinterrenovering          [Klar]│
│ Bengt Karlsson                  │
├─────────────────────────────────┤
│ D1179 • 2 feb           🗑      │
└────────────────────────────────┘
```

**EstimateBuilder Header - EFTER:**
```
┌────────────────────────────────────────┐
│ ← Tillbaka              💾  🗑        │
├────────────────────────────────────────┤
│ OFFERT [KLAR]                          │
│ Tony-test                              │
│ OFF-2026-0028 • v1 • 3 feb 2026        │
│ 👤 Adam Miakhil                        │
│ 📍 Jan Waldenströms gata 214           │
└────────────────────────────────────────┘
```

**Förhandsgranskning - EFTER:**
- Fullbredd sheet
- Horisontellt scrollbar tabell
- All text synlig
