

## Mål

Gör så att den mörka overlayen även täcker sidebaren för bättre färgkontrast.

---

## Problem

Sidebaren i `AppLayout.tsx` har `z-50` medan den mörka overlayen i `GlobalFeedbackPopup.tsx` har `z-40`. Detta gör att sidebaren ligger **ovanpå** overlayen och förblir ljus.

```text
Nuvarande z-index:
┌─────────────────────────────────────────────────┐
│  Feedback popup:  z-50                          │
│  Sidebar:         z-50  ← Ligger ovanpå overlay │
│  Overlay:         z-40                          │
└─────────────────────────────────────────────────┘
```

---

## Lösning

Höj z-index på overlayen till `z-[60]` så att den ligger ovanpå sidebaren (som har `z-50`). Feedback-popupen behöver också höjas till `z-[70]` för att ligga ovanpå overlayen.

```text
Ny z-index:
┌─────────────────────────────────────────────────┐
│  Feedback popup:  z-[70]  ← Överst              │
│  Overlay:         z-[60]  ← Täcker sidebaren    │
│  Sidebar:         z-50                          │
└─────────────────────────────────────────────────┘
```

---

## Teknisk implementation

### Fil: `src/components/global-assistant/GlobalFeedbackPopup.tsx`

**Ändring 1 - Rad 101 (overlay):**
```tsx
// Från:
<div className="fixed inset-0 z-40 bg-black/80" />

// Till:
<div className="fixed inset-0 z-[60] bg-black/80" />
```

**Ändring 2 - Rad 104-111 (popup-kortet):**
```tsx
// Från:
<div className={cn(
  "fixed z-50 w-80 rounded-xl border border-border/60 bg-card p-4 shadow-lg",
  ...
)}>

// Till:
<div className={cn(
  "fixed z-[70] w-80 rounded-xl border border-border/60 bg-card p-4 shadow-lg",
  ...
)}>
```

---

## Sammanfattning

| Ändring | Från | Till |
|---------|------|------|
| Overlay z-index | `z-40` | `z-[60]` |
| Popup z-index | `z-50` | `z-[70]` |

---

## Resultat

- Hela skärmen blir mörk, inklusive sidebaren
- Bättre färgkontrast
- Feedback-popupen är fortfarande klickbar ovanpå allt

