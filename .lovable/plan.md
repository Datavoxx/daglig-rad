
# Plan: Lägg till Global Assistant chatbox på Dashboard

## Mål
Lägga till Global Assistant:s chatinmatning mellan hälsningsrutan ("God morgon, Isak!") och KPI-korten på Dashboard-sidan, så att användaren kan börja chatta direkt från startsidan.

## Design

```text
┌──────────────────────────────────────────────────────────┐
│  ✨ Dashboard                                            │
│  God morgon, Isak! 👋        [Ny offert] [Registrera...] │
│  Här är din översikt för idag                            │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│         ✨ Vad kan jag hjälpa dig med?                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [+] Fråga vad som helst...              [🎤] [➤]  │  │
│  └────────────────────────────────────────────────────┘  │
│  [Skapa offert] [Skapa projekt] [Sök kund] [Ny kund]...  │
└──────────────────────────────────────────────────────────┘
                            ↓
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ Personal  │ │  Timmar   │ │  Aktiva   │ │ Obetalda  │
│ på plats  │ │   7.0h    │ │  projekt  │ │ fakturor  │
│     0     │ │           │ │     1     │ │     0     │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

## Teknisk lösning

### Steg 1: Skapa en ny komponent `DashboardAssistantWidget`

En fristående komponent som innehåller:
- Kompakt header med ✨-ikon och text "Vad kan jag hjälpa dig med?"
- `ChatInput`-komponenten (återanvänd från global-assistant)
- `QuickSuggestions`-komponenten (återanvänd från global-assistant)
- Vid inmatning → navigera till `/global-assistant` med meddelandet som state

### Steg 2: Integrera i Dashboard

Placera komponenten mellan hero-sektionen och KPI-sektionen.

## Implementation

### Ny fil: `src/components/dashboard/DashboardAssistantWidget.tsx`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/global-assistant/ChatInput";
import { QuickSuggestions } from "@/components/global-assistant/QuickSuggestions";

export function DashboardAssistantWidget() {
  const navigate = useNavigate();

  const handleSend = (message: string) => {
    // Navigera till Global Assistant med meddelandet
    navigate("/global-assistant", { 
      state: { initialMessage: message } 
    });
  };

  return (
    <section className="rounded-2xl border border-border/40 bg-card/50 p-6 ring-1 ring-black/5 dark:ring-white/5">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Compact header */}
        <div className="flex items-center justify-center gap-2 text-center">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">
            Vad kan jag hjälpa dig med?
          </h2>
        </div>
        
        {/* Chat input */}
        <ChatInput onSend={handleSend} />
        
        {/* Quick suggestions */}
        <QuickSuggestions onSelect={handleSend} />
      </div>
    </section>
  );
}
```

### Uppdatera `src/pages/Dashboard.tsx`

Lägg till den nya komponenten mellan hero och KPI:

```tsx
import { DashboardAssistantWidget } from "@/components/dashboard/DashboardAssistantWidget";

// ...i return:
<div className="space-y-6 animate-in">
  {/* Hero Section */}
  <section>...</section>
  
  {/* NY: Global Assistant Widget */}
  <DashboardAssistantWidget />
  
  {/* KPI Cards */}
  <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">...</section>
```

### Uppdatera `src/pages/GlobalAssistant.tsx`

Läs `initialMessage` från location state och skicka automatiskt:

```tsx
import { useLocation } from "react-router-dom";

const location = useLocation();

useEffect(() => {
  // Skicka initial meddelande om det finns i state
  const initialMessage = location.state?.initialMessage;
  if (initialMessage && messages.length === 0) {
    sendMessage(initialMessage);
    // Rensa state så det inte skickas igen vid refresh
    window.history.replaceState({}, document.title);
  }
}, [location.state?.initialMessage]);
```

## Filer att ändra/skapa

| Fil | Åtgärd |
|-----|--------|
| `src/components/dashboard/DashboardAssistantWidget.tsx` | **Skapa** - Ny widget-komponent |
| `src/pages/Dashboard.tsx` | **Ändra** - Importera och lägg till widget |
| `src/pages/GlobalAssistant.tsx` | **Ändra** - Läs initialMessage från navigation state |

## Resultat

- Användaren ser chatinmatningen direkt på Dashboard
- Quick suggestions (Skapa offert, Skapa projekt, etc.) visas under inputfältet
- Vid klick/inmatning navigeras användaren till `/global-assistant` där konversationen startar automatiskt
- Sömlös upplevelse utan extra klick
