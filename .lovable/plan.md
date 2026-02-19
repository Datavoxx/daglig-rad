

## Fix: Chat-interfacet kollapsar vid langa konversationer

### Rotorsak

Problemet uppstar BARA i den langa konversationen (40 meddelanden) pa grund av `scrollIntoView()` i `MessageList.tsx` (rad 166):

```typescript
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
```

`scrollIntoView` scrollar ALLA scrollbara foraldra-element for att gora elementet synligt - inte bara den narmaste `overflow-y-auto`-containern. Med manga meddelanden gor detta att foraldra-layouten (AppLayout, main, page-transition) ocksa scrollas, vilket pressar inputfaltet uppat och ut ur synfaltet.

### Losning

Byt ut `scrollIntoView` mot direkt `scrollTop`-manipulation pa scroll-containern. Detta garanterar att bara MessageList-containern scrollar, aldrig nagon foraldra-element.

### Teknisk implementation

**Fil: `src/components/global-assistant/MessageList.tsx`**

1. Lagg till en `ref` pa den yttre scroll-containern (`overflow-y-auto`-diven)
2. Ersatt `scrollIntoView` med:
   ```typescript
   const scrollRef = useRef<HTMLDivElement>(null);
   
   useEffect(() => {
     const el = scrollRef.current;
     if (el) {
       el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
     }
   }, [messages]);
   ```
3. Ta bort `bottomRef` (behovs inte langre)

### Varfor detta fixar problemet

- `scrollTo` pa scroll-containern paverkar BARA den containern
- Inga foraldra-element scrollas oavsett hur manga meddelanden som finns
- Fungerar identiskt for 1 meddelande och 1000 meddelanden

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/components/global-assistant/MessageList.tsx` | Byt `scrollIntoView` till `scrollTo` pa scroll-containern |

