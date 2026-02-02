

## Plan: Lägg till "Redo?"-prompt bredvid DRAFT-badge

### Problem

Även om DRAFT-badgen nu är klickbar för att ändra status, är det inte uppenbart för användaren. Du vill ha en visuell hint som uppmuntrar användaren att markera offerten som klar.

---

### Lösning

Lägg till en liten klickbar text bredvid DRAFT-badgen som fungerar som en uppmaning. Texten visas endast när status är "draft" och försvinner när offerten är markerad som klar.

---

### Design

**Visuellt utseende:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  OFFERT                      Redo? DRAFT OFF-DRAFT  │
│  Projektnamn                       v1 • 2 feb 2026  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **"Redo?"** visas som en liten klickbar text i en accentfärg (primary/orange)
- Texten har en hover-effekt och pil som pekar mot badgen
- När man klickar på "Redo?" triggas samma funktion som att klicka på badgen
- När status är "KLAR" försvinner prompten helt

---

### Teknisk implementation

**Fil: `src/components/estimates/EstimateHeader.tsx`**

Lägg till den klickbara prompten precis före Badge-komponenten:

```typescript
<div className="flex items-center gap-2 justify-end">
  {/* Prompt som endast visas för draft-status */}
  {status === "draft" && onStatusChange && (
    <button
      onClick={handleBadgeClick}
      className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5 animate-pulse"
    >
      <span>Redo?</span>
      <ChevronRight className="h-3 w-3" />
    </button>
  )}
  
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge ...>
          {status === "draft" ? "DRAFT" : "KLAR"}
        </Badge>
      </TooltipTrigger>
      ...
    </Tooltip>
  </TooltipProvider>
  
  <span className="text-[13px] font-medium">
    {displayOfferNumber}
  </span>
</div>
```

---

### Alternativa texter

Beroende på vad som känns bäst kan vi använda:
- **"Redo?"** - Kort och snabbt
- **"Markera klar →"** - Mer beskrivande  
- **"Klar att skicka?"** - Kontextuellt
- **"Godkänd?"** - Om fokus är på kundgodkännande

---

### Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/EstimateHeader.tsx` | Lägg till klickbar "Redo?"-prompt före badge |

---

### Resultat

| Status | Före | Efter |
|--------|------|-------|
| Draft | `DRAFT  OFF-DRAFT` | `Redo? → DRAFT  OFF-DRAFT` |
| Klar | `KLAR  OFF-001` | `KLAR  OFF-001` (ingen prompt) |

Prompten ger användaren en tydlig visuell signal om att de kan markera offerten som klar, utan att ta för mycket plats eller vara störande.

