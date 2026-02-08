

## Mål

Skapa en tvåstegs feedback-popup:

1. **Steg 1 (Efter att lämna chatten)**: Helskärms mörk overlay med centrerad feedback-popup
2. **Steg 2 (Efter klick på "Visa konversationen")**: Bakgrunden fortfarande mörk, men popup flyttas ner till nedre vänstra hörnet
3. **Steg 3 (Efter skicka/hoppa över)**: Allt försvinner, skärmen blir ljus igen

---

## Visuell översikt

```text
STEG 1: Initial visning (efter att lämna chatten)
┌─────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░ ┌────────────────────┐ ░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░ │   Hur gick det?    │ ░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░ │   ☆ ☆ ☆ ☆ ☆       │ ░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░ │ [Visa konversation]│ ░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░ └────────────────────┘ ░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────┘

STEG 2: Efter klick på "Visa konversationen"
┌─────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░ Konversation (synlig genom overlay) ░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ┌────────────────────┐ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  │ Hur gick det?      │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  │ ☆☆☆☆☆ [Skicka]    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  └────────────────────┘ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────┘

STEG 3: Efter skicka/hoppa över
┌─────────────────────────────────────────────────────────┐
│  Konversation (helt synlig, ingen overlay)              │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Teknisk implementation

### 1. Lägg till state för att spåra om användaren har visat konversationen

```typescript
const [hasViewedConversation, setHasViewedConversation] = useState(false);

// Reset när popup öppnas
useEffect(() => {
  if (open) {
    setHasViewedConversation(false);
    // ... existing reset logic
  }
}, [open]);
```

### 2. Uppdatera handleViewConversation

```typescript
const handleViewConversation = () => {
  navigate(`/global-assistant?conversationId=${conversationId}`);
  setHasViewedConversation(true);  // Triggar flytt till hörnet
};
```

### 3. Ny JSX-struktur med overlay och positioneringslogik

```tsx
return (
  <>
    {/* Mörk overlay - alltid synlig när popup är öppen */}
    <div 
      className="fixed inset-0 z-40 bg-black/80"
      onClick={onClose}  // Klick på overlay stänger
    />
    
    {/* Feedback-kortet - positioneras baserat på state */}
    <div
      className={cn(
        "fixed z-50 w-80 rounded-xl border bg-card p-4 shadow-lg",
        "transition-all duration-300",
        hasViewedConversation
          ? "bottom-4 left-4"  // Steg 2: I hörnet
          : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"  // Steg 1: Centrerad
      )}
    >
      {/* Popup-innehåll */}
    </div>
  </>
);
```

---

## Detaljer

| Steg | Overlay | Popup-position | Trigger |
|------|---------|----------------|---------|
| 1 | Synlig (bg-black/80) | Centrerad | Popup öppnas |
| 2 | Synlig (bg-black/80) | Nedre vänstra hörnet | Klick på "Visa konversationen" |
| 3 | Borta | Borta | Klick på "Skicka" eller "Hoppa över" |

---

## Sammanfattning av ändringar

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/components/global-assistant/GlobalFeedbackPopup.tsx` | Lägg till `hasViewedConversation` state |
| 2 | `src/components/global-assistant/GlobalFeedbackPopup.tsx` | Lägg till mörk overlay-div |
| 3 | `src/components/global-assistant/GlobalFeedbackPopup.tsx` | Dynamisk positionering baserat på state |
| 4 | `src/components/global-assistant/GlobalFeedbackPopup.tsx` | Smooth transition mellan positioner |

