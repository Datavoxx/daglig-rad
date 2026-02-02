
## Plan: Separera Spara och Markera som Klar

### Problem

Just nu gör spara-knappen i headern två saker samtidigt:
1. Sparar offerten
2. Markerar den som "Klar" och visar "Starta projekt"-dialogen

Du vill:
1. **Spara-knappen** ska ENDAST spara som draft
2. **Klicka på DRAFT/KLAR-badgen** för att ändra status
3. **"Starta projekt"-dialogen** ska ENDAST visas när man aktivt markerar som klar

---

### Lösning

#### 1. Ändra Spara-knappen (header)

**Fil: `src/components/estimates/EstimateBuilder.tsx`**

```typescript
// FÖRE (rad 305-316)
<Button
  size="sm"
  onClick={handleSaveAsCompleted}  // <- Markerar som klar
  ...
>

// EFTER
<Button
  size="sm"
  onClick={handleSaveAsDraft}  // <- Sparar endast som draft
  ...
>
```

#### 2. Gör Badge klickbar för statusändring

**Fil: `src/components/estimates/EstimateHeader.tsx`**

Lägg till en `onStatusChange` prop och gör badgen klickbar:

```typescript
interface EstimateHeaderProps {
  // ... existing props
  onStatusChange?: (newStatus: "draft" | "completed") => void;
}

// I render:
<Badge 
  variant={status === "draft" ? "secondary" : "default"}
  className={cn(
    status === "completed" ? "bg-green-600 hover:bg-green-600" : "",
    onStatusChange && "cursor-pointer hover:opacity-80 transition-opacity"
  )}
  onClick={() => {
    if (onStatusChange) {
      // Toggle: draft -> completed, completed -> draft
      onStatusChange(status === "draft" ? "completed" : "draft");
    }
  }}
>
  {status === "draft" ? "DRAFT" : "KLAR"}
</Badge>
```

#### 3. Hantera statusändring i EstimateBuilder

Skapa en ny handler som triggar "Starta projekt"-dialogen endast vid status -> completed:

```typescript
const handleStatusChange = async (newStatus: "draft" | "completed") => {
  if (newStatus === "completed") {
    // Markera som klar och visa dialog
    await handleSaveAsCompleted();
  } else {
    // Tillbaka till draft
    estimate.updateStatus("draft");
    estimate.save();
    toast.success("Status ändrad till draft");
  }
};

// I EstimateHeader:
<EstimateHeader
  ...
  onStatusChange={handleStatusChange}
/>
```

---

### Visuell förändring

| Element | Före | Efter |
|---------|------|-------|
| Spara-knapp (header) | Sparar + markerar som klar | Sparar endast som draft |
| DRAFT/KLAR badge | Endast visuell | Klickbar - ändrar status |
| StickyTotals dropdown | Har båda alternativen | Behålls oförändrad |

---

### Användarflöde (efter ändring)

1. **Jobba med offert** -> Klicka Spara -> Sparas som draft
2. **Färdig med offert** -> Klicka på "DRAFT"-badgen
3. **Status ändras till "KLAR"** -> "Starta projekt"-dialog visas
4. **Vill ångra?** -> Klicka på "KLAR"-badgen -> Tillbaka till draft

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Ändra header-knapp till draft + lägg till statusChange handler |
| `src/components/estimates/EstimateHeader.tsx` | Lägg till `onStatusChange` prop och klickbar badge |

---

### Tooltip för tydlighet

Lägg till en tooltip på badgen som förklarar funktionen:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge ...>
        {status === "draft" ? "DRAFT" : "KLAR"}
      </Badge>
    </TooltipTrigger>
    <TooltipContent>
      <p>{status === "draft" ? "Klicka för att markera som klar" : "Klicka för att ändra till draft"}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```
