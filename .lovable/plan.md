

## Mål

Skapa en **global feedback-popup** som dyker upp 60 sekunder efter att användaren lämnar en konversation med Byggio AI.

---

## Så här ska det fungera

1. Användaren har en konversation på `/global-assistant`
2. Användaren navigerar bort (t.ex. till `/dashboard`)
3. 60 sekunder senare → popup visas
4. Popup innehåller:
   - Rubrik: "Hur tyckte du det gick i din senaste konversation med Byggio AI?"
   - Länk till konversationen (för att återfriska minnet)
   - 5 stjärnor för betyg
   - Textfält: "Vad var bra?"
   - Textfält: "Vad kan göras bättre?"
   - Skicka/Hoppa över-knappar

---

## Teknisk lösning

### 1. Ny Context: `ConversationFeedbackProvider`

En React Context som:
- Lyssnar på route-ändringar
- Sparar `lastConversationId` när användaren lämnar `/global-assistant`
- Startar en 60-sekunders timer
- Visar popup när timern går ut

```text
src/contexts/ConversationFeedbackContext.tsx
```

### 2. Ny Komponent: `GlobalFeedbackPopup`

En AlertDialog/Dialog som visas som overlay:
- Visar konversationslänk
- 5-stjärnig rating
- Två textfält (bra / kan förbättras)
- Sparar till `ai_feedback`-tabellen

```text
src/components/global-assistant/GlobalFeedbackPopup.tsx
```

### 3. Uppdatera GlobalAssistant.tsx

När konversationen har meddelanden, exportera `conversationId` till context vid unmount:

```typescript
// Vid unmount eller route-ändring
useEffect(() => {
  return () => {
    if (currentConversationId && messages.length > 1) {
      setLastConversation(currentConversationId);
    }
  };
}, [currentConversationId, messages]);
```

### 4. Uppdatera App.tsx

Wrappa appen med `ConversationFeedbackProvider`:

```tsx
<ConversationFeedbackProvider>
  <BrowserRouter>
    ...
  </BrowserRouter>
</ConversationFeedbackProvider>
```

---

## Dataflöde

```text
┌─────────────────────────────────────────────────────────────────┐
│  GlobalAssistant                                                │
│  ─────────────────                                              │
│  - Användaren chattar                                           │
│  - conversationId sparas                                        │
│                                                                 │
│  [Användaren navigerar bort]                                    │
│        ↓                                                        │
│  setLastConversation(id)                                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  ConversationFeedbackProvider                                   │
│  ────────────────────────────                                   │
│  - Tar emot lastConversationId                                  │
│  - Kollar: har feedback redan getts för denna?                  │
│  - Startar 60s timer                                            │
│        ↓ (efter 60s)                                            │
│  showPopup = true                                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  GlobalFeedbackPopup                                            │
│  ──────────────────                                             │
│  - Visar dialog med:                                            │
│    • Rubrik + länk till konversation                            │
│    • 5 stjärnor                                                 │
│    • "Vad var bra?"                                             │
│    • "Vad kan göras bättre?"                                    │
│  - Sparar till ai_feedback                                      │
│  - Stänger popup                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Databas

Den befintliga `ai_feedback`-tabellen räcker:

| Kolumn | Användning |
|--------|------------|
| `conversation_id` | Länka till konversationen |
| `task_type` | Sätt till `"conversation_feedback"` |
| `rating` | 1-5 stjärnor |
| `comment` | Kombinera båda textfälten |

Alternativt kan vi utöka tabellen med en kolumn för "what was good" och "what can be improved", men vi kan börja med att kombinera dem i `comment`.

---

## Tekniska detaljer

### ConversationFeedbackContext.tsx

```typescript
interface ConversationFeedbackContextType {
  setLastConversation: (id: string) => void;
}

const ConversationFeedbackContext = createContext<...>();

export function ConversationFeedbackProvider({ children }) {
  const [lastConversationId, setLastConversationId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  // När lastConversationId sätts och vi INTE är på /global-assistant
  useEffect(() => {
    if (lastConversationId && !location.pathname.includes("/global-assistant")) {
      // Kolla om feedback redan getts
      checkExistingFeedback(lastConversationId).then((exists) => {
        if (!exists) {
          timerRef.current = setTimeout(() => {
            setShowPopup(true);
          }, 60000); // 60 sekunder
        }
      });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastConversationId, location.pathname]);

  // Om användaren går tillbaka till /global-assistant, avbryt timer
  useEffect(() => {
    if (location.pathname.includes("/global-assistant")) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowPopup(false);
    }
  }, [location.pathname]);

  return (
    <ConversationFeedbackContext.Provider value={{ setLastConversation: setLastConversationId }}>
      {children}
      <GlobalFeedbackPopup
        open={showPopup}
        conversationId={lastConversationId}
        onClose={() => {
          setShowPopup(false);
          setLastConversationId(null);
        }}
      />
    </ConversationFeedbackContext.Provider>
  );
}
```

### GlobalFeedbackPopup.tsx

```typescript
interface GlobalFeedbackPopupProps {
  open: boolean;
  conversationId: string | null;
  onClose: () => void;
}

export function GlobalFeedbackPopup({ open, conversationId, onClose }) {
  const [rating, setRating] = useState(0);
  const [whatWasGood, setWhatWasGood] = useState("");
  const [whatCanImprove, setWhatCanImprove] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    // Kombinera kommentarer
    const comment = [
      whatWasGood && `Bra: ${whatWasGood}`,
      whatCanImprove && `Förbättra: ${whatCanImprove}`,
    ].filter(Boolean).join(" | ");

    await supabase.from("ai_feedback").insert({
      user_id: userId,
      conversation_id: conversationId,
      task_type: "conversation_feedback",
      rating,
      comment: comment || null,
    });

    onClose();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hur tyckte du det gick i din senaste konversation med Byggio AI?
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Länk till konversationen */}
        <Button
          variant="link"
          onClick={() => {
            navigate(`/global-assistant?conversationId=${conversationId}`);
            onClose();
          }}
        >
          Visa konversationen
        </Button>

        {/* 5 stjärnor */}
        <div className="flex justify-center gap-1">
          {[1,2,3,4,5].map(v => (
            <Star 
              key={v}
              onClick={() => setRating(v)}
              className={v <= rating ? "fill-yellow-400" : "text-muted"}
            />
          ))}
        </div>

        {/* Textfält */}
        <Textarea
          placeholder="Vad var bra?"
          value={whatWasGood}
          onChange={e => setWhatWasGood(e.target.value)}
        />
        <Textarea
          placeholder="Vad kan göras bättre?"
          value={whatCanImprove}
          onChange={e => setWhatCanImprove(e.target.value)}
        />

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose}>Hoppa över</Button>
          <Button onClick={handleSubmit} disabled={rating === 0}>Skicka</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Filer att skapa/ändra

| # | Fil | Åtgärd |
|---|-----|--------|
| 1 | `src/contexts/ConversationFeedbackContext.tsx` | Skapa - global context med timer-logik |
| 2 | `src/components/global-assistant/GlobalFeedbackPopup.tsx` | Skapa - popup-komponenten |
| 3 | `src/pages/GlobalAssistant.tsx` | Uppdatera - anropa `setLastConversation` vid unmount |
| 4 | `src/App.tsx` | Uppdatera - wrappa med provider |

---

## Resultat

- Användaren lämnar en konversation med Byggio AI
- 60 sekunder senare visas en feedback-popup
- Popup innehåller länk till konversationen, stjärnbetyg och textfält
- Feedback sparas till `ai_feedback`-tabellen
- Om användaren går tillbaka till `/global-assistant` avbryts timern

