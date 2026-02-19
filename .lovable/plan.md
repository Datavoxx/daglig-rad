

## Fix: Chatten kollapsar -- bruten hojdkedja genom RouteTransition

### Rotorsak

Layoutkedjan fran `AppLayout` till `GlobalAssistant` ser ut sa har:

```text
AppLayout (h-screen, flex, overflow-hidden)
  main-content (flex-1, flex-col, overflow-hidden)
    header (h-14)
    main (flex-1, overflow-hidden)
      div (h-full)                          <-- OK
        RouteTransition div.page-transition <-- INGEN HOJD! Bryter kedjan
          GlobalAssistant (h-[calc(100vh-3.5rem)])  <-- Fel referens
```

Tva problem:
1. **`RouteTransition`** wrappar allt i en `div` utan hojd -- det bryter hojdkedjan sa att `h-full` inte propageras vidare
2. **`GlobalAssistant`** anvander `h-[calc(100vh-3.5rem)]` som beraknar fran viewport istallet for foralderns faktiska storlek. Pa vissa enheter/skarmar kan detta ge en storre hojd an det tillgangliga utrymmet, vilket pressar inputfaltet utanfor synligt omrade

### Losning

Tva filandringar som skapar en obruten hojdkedja:

**Fil 1: `src/components/layout/RouteTransition.tsx`**

Nar routen ar `/global-assistant`, lagg till `h-full` pa wrapper-diven sa att hojden propageras:

```typescript
export function RouteTransition({ children, className = "" }: RouteTransitionProps) {
  const location = useLocation();
  const needsFullHeight = location.pathname === "/global-assistant";
  
  return (
    <div 
      key={location.pathname}
      className={`page-transition ${className} ${needsFullHeight ? "h-full" : ""}`}
    >
      {children}
    </div>
  );
}
```

**Fil 2: `src/pages/GlobalAssistant.tsx`**

Byt fran viewport-baserad hojd till `h-full`:

- Fran: `className="relative flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden"`
- Till: `className="relative flex h-full flex-col overflow-hidden"`

### Varfor detta fixar problemet

- `RouteTransition` med `h-full` lat hojden floda fran `AppLayout` hela vagen ner
- `h-full` pa `GlobalAssistant` arver exakt den tillgangliga hojden fran foraldra-elementet, inte en separat viewport-berakning
- Oavsett antal meddelanden fyller `MessageList` (med `flex-1 min-h-0`) alltid utrymmet mellan header och input
- Inputfaltet stannar alltid langst ner

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/components/layout/RouteTransition.tsx` | Villkorlig `h-full` for `/global-assistant` |
| `src/pages/GlobalAssistant.tsx` | Byt `h-[calc(100vh-3.5rem)]` till `h-full` |

