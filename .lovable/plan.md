

## Mål

Gör feedback-popupen mindre störande och mer elegant - så att användaren kan se konversationen bakom.

---

## Designförslag

### Alternativ A: Flytande kort i nedre vänstra hörnet (Rekommenderas)

En liten, kompakt panel som "flyter" i hörnet - ingen overlay som blockerar bakgrunden.

```text
┌─────────────────────────────────────────────────────────┐
│  Konversation (synlig)                                  │
│                                                         │
│                                                         │
│                                                         │
│  ┌──────────────────────────┐                           │
│  │ ⭐ Hur gick det?         │                           │
│  │ ☆ ☆ ☆ ☆ ☆              │                           │
│  │ [Visa konversationen]    │                           │
│  │ [Hoppa över] [Skicka]    │                           │
│  └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

**Fördelar:**
- Blockerar inte konversationen
- Känns som en diskret notis/toast
- Användaren kan scrolla i chatten samtidigt

---

### Alternativ B: Slide-in panel från vänster

En smalare panel som glider in från vänster sida.

```text
┌────────────────┬────────────────────────────────────────┐
│ Feedback       │  Konversation (synlig)                 │
│ ────────────── │                                        │
│ ⭐ Hur gick    │                                        │
│ det?           │                                        │
│                │                                        │
│ ☆ ☆ ☆ ☆ ☆    │                                        │
│                │                                        │
│ [Hoppa över]   │                                        │
│ [Skicka]       │                                        │
└────────────────┴────────────────────────────────────────┘
```

---

### Alternativ C: Kompakt toast-stil (längst ned)

Ännu mer minimal - som en expanderbar toast.

```text
┌─────────────────────────────────────────────────────────┐
│  Konversation                                           │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ⭐ Hur tyckte du det gick? ☆☆☆☆☆  [Hoppa över]        │
└─────────────────────────────────────────────────────────┘
```

---

## Rekommendation: Alternativ A

En flytande panel i nedre vänstra hörnet som:

1. **Ingen overlay** - Tar bort den mörka bakgrunden
2. **Kompakt storlek** - Max 320px bred
3. **Positionerad i hörnet** - `fixed bottom-4 left-4`
4. **Subtil skugga** - Ger djup utan att vara störande
5. **Animerad** - Glider in mjukt från vänster

---

## Teknisk implementation

### Byt från AlertDialog till fast positionerat kort

```tsx
// Istället för AlertDialog, använd ett fast positionerat kort
<div className={cn(
  "fixed bottom-4 left-4 z-50 w-80 rounded-xl border bg-card p-4 shadow-lg",
  "animate-in slide-in-from-left-4 duration-300",
  !open && "hidden"
)}>
  {/* Kompakt innehåll */}
</div>
```

### Kompaktare layout

- Mindre stjärnor (h-6 istället för h-8)
- Kortare textfält (min-h-[60px])
- Tightare spacing

---

## Sammanfattning

| # | Ändring |
|---|---------|
| 1 | Byt från AlertDialog till fast positionerat kort |
| 2 | Ta bort mörk overlay |
| 3 | Positionera i nedre vänstra hörnet |
| 4 | Minska storlek och padding |
| 5 | Lägg till slide-in animation |

---

## Resultat

- Feedback-panelen flyter diskret i hörnet
- Användaren kan se och scrolla konversationen bakom
- Känns modern och icke-störande
- Fortfarande alla funktioner: stjärnor, textfält, knappar

