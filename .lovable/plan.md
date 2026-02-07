

# Plan: Byt namn till Byggio AI + Lägg till "Testa nya" label

## Mål
1. Döpa om "Global Assistant" till "Byggio AI" i hela applikationen
2. Lägga till texten "Testa nya Byggio AI" ovanför chatwidgeten på Dashboard

## Design på Dashboard

```text
             Testa nya Byggio AI ✨
┌──────────────────────────────────────────────────────────┐
│         ✨ Vad kan jag hjälpa dig med?                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [+] Fråga vad som helst...              [🎤] [➤]  │  │
│  └────────────────────────────────────────────────────┘  │
│  [Skapa offert] [Skapa projekt] [Sök kund] ...           │
└──────────────────────────────────────────────────────────┘
```

## Ändringar

### 1. Dashboard-widgeten: Lägg till label

**Fil:** `src/components/dashboard/DashboardAssistantWidget.tsx`

Lägg till en etikett ovanför boxen:

```tsx
return (
  <div className="space-y-2">
    {/* "Testa nya" label */}
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Testa nya
      </span>
      <span className="text-sm font-semibold text-primary">
        Byggio AI
      </span>
      <Sparkles className="h-4 w-4 text-primary" />
    </div>
    
    {/* Befintlig box */}
    <section className="rounded-2xl border ...">
      ...
    </section>
  </div>
);
```

### 2. GlobalAssistant-sidan: Byt namn i header

**Fil:** `src/pages/GlobalAssistant.tsx`

Ändra:
```tsx
// Rad 369: Från
<span className="text-sm font-medium">Global Assistant</span>

// Till
<span className="text-sm font-medium">Byggio AI</span>
```

### 3. (Valfritt) App.tsx: Behåll routen

Routen `/global-assistant` kan behållas som tekniskt namn då den inte syns för användaren.

## Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/components/dashboard/DashboardAssistantWidget.tsx` | Lägg till "Testa nya Byggio AI" label ovanför boxen |
| `src/pages/GlobalAssistant.tsx` | Byt "Global Assistant" → "Byggio AI" i header |

## Resultat

- Användaren ser "Testa nya Byggio AI" på Dashboard ovanför chatwidgeten
- Assistentsidans header visar "Byggio AI" istället för "Global Assistant"
- Routen förblir `/global-assistant` (tekniskt namn, osynligt för användare)

