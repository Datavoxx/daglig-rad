
# Plan: Snabbknappar med val - Gå direkt eller AI

## Mål
Ändra snabbknapparna ("Ny offert", "Registrera tid", "Nytt projekt", "Ny faktura") så att de visar en dropdown med två alternativ:
1. **Gå direkt** → Navigera till sidan
2. **Låt AI lösa** → Starta en chatt i Global Assistant med lämpligt meddelande

## Design

```text
┌─────────────────┐
│   [Ny offert ▼] │ ← Knappen öppnar dropdown
└─────────────────┘
        ↓
┌───────────────────────┐
│ 📄 Gå direkt          │ → /estimates
├───────────────────────┤
│ ✨ Låt AI lösa        │ → Global Assistant: "Skapa ny offert"
└───────────────────────┘
```

## AI-meddelanden per knapp

| Knapp | AI-meddelande |
|-------|---------------|
| Ny offert | "Skapa ny offert" |
| Registrera tid | "Registrera tid" |
| Nytt projekt | "Skapa nytt projekt" |
| Ny faktura | "Skapa ny faktura" |

## Teknisk lösning

### Uppdatera `quickActions` med AI-meddelande

```tsx
const quickActions = [
  {
    title: "Ny offert",
    icon: Calculator,
    href: "/estimates",
    aiMessage: "Skapa ny offert",
  },
  {
    title: "Registrera tid",
    icon: Clock,
    href: "/time-reporting",
    aiMessage: "Registrera tid",
  },
  {
    title: "Nytt projekt",
    icon: FolderKanban,
    href: "/projects",
    aiMessage: "Skapa nytt projekt",
  },
  {
    title: "Ny faktura",
    icon: Receipt,
    href: "/invoices",
    aiMessage: "Skapa ny faktura",
  },
];
```

### Byt ut Button mot DropdownMenu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Sparkles } from "lucide-react";

// I render:
<div className="flex flex-wrap gap-2">
  {quickActions.map((action) => (
    <DropdownMenu key={action.title}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.title}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(action.href)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Gå direkt
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/global-assistant", { 
            state: { initialMessage: action.aiMessage } 
          })}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Låt AI lösa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ))}
</div>
```

## Fil att ändra

| Fil | Ändring |
|-----|---------|
| `src/pages/Dashboard.tsx` | Lägg till `aiMessage` i quickActions, byt ut Button mot DropdownMenu |

## Resultat

| Före | Efter |
|------|-------|
| Klick → Direkt navigering | Klick → Dropdown med två val |
| Ingen AI-integration | "Låt AI lösa" startar assistent-chatt |
| Enkel knapp | Dropdown med ikoner för tydlighet |
