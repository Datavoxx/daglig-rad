

## Fix: Chatten kollapsar nar man skriver i inputfaltet

### Rotorsak

Layouten i `GlobalAssistant.tsx` anvander en flex-kolumn med `flex-1` pa `MessageList`. I CSS flexbox ar standardvardet for `min-height` satt till `auto`, vilket betyder att ett flex-barn aldrig krymper mindre an sitt innehall. Nar textarean i `ChatInput` andrar storlek (auto-resize vid knapptryckning) rakar flex-layouten om och `MessageList` kollapsar till noll hojd eftersom webbläsaren inte kan bestamma korrekt hojd for alla barn.

Losningen ar att lagga till `min-h-0` pa `MessageList`-wrappern och `overflow-hidden` pa yttre containern. Detta tvingar flexboxen att respektera den fasta hojden och lata `overflow-y-auto` pa `MessageList` hantera scrollning korrekt.

### Teknisk implementation

**Fil 1:** `src/pages/GlobalAssistant.tsx` (rad 611)

Lagg till `overflow-hidden` pa yttre containern:
- Fran: `className="relative flex h-[calc(100vh-3.5rem)] flex-col"`
- Till: `className="relative flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden"`

**Fil 2:** `src/components/global-assistant/MessageList.tsx` (rad 170)

Lagg till `min-h-0` pa MessageList-wrappern:
- Fran: `className="flex-1 overflow-y-auto px-4 py-6"`
- Till: `className="flex-1 min-h-0 overflow-y-auto px-4 py-6"`

### Varfor detta fixar problemet

- `overflow-hidden` pa foraldra-containern sager at flexboxen: "du far INTE vaxa utanfor denna hojd"
- `min-h-0` pa `MessageList` overskrider standard `min-height: auto` och tillater flex-barnet att krympa korrekt
- Resultatet: `MessageList` fyller alltid det tillgangliga utrymmet mellan headern och inputfaltet, och scrollar internt

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/pages/GlobalAssistant.tsx` | Lagg till `overflow-hidden` pa yttre flex-containern |
| `src/components/global-assistant/MessageList.tsx` | Lagg till `min-h-0` pa wrapper-diven |
