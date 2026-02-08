
## Mål

Fixa tre saker med feedback-popupen:

1. **"Visa konversationen"-länken** ska navigera till rätt konversation (med `conversationId` i URL)
2. **Popup ska stanna kvar** efter att man klickat på länken
3. **Timer** ska halveras från 60s till 30s

---

## Problem 1: Navigering till rätt konversation

**Nuvarande beteende:**
- `GlobalFeedbackPopup` navigerar till `/global-assistant?conversationId=xxx`
- Men `GlobalAssistant.tsx` har ingen logik för att läsa denna URL-parameter och ladda konversationen

**Lösning:**
- Lägg till en `useEffect` i `GlobalAssistant.tsx` som läser `conversationId` från URL och laddar konversationen från databasen

---

## Problem 2: Popup stängs när man navigerar

**Nuvarande beteende (i `ConversationFeedbackContext.tsx`):**
```typescript
// Rad 60-65: Stänger popup när man går till /global-assistant
useEffect(() => {
  if (location.pathname.includes("/global-assistant")) {
    setShowPopup(false);  // ← Problemet
  }
}, [location.pathname]);
```

**Lösning:**
- Ta bort logiken som automatiskt stänger popup när man går till `/global-assistant`
- Popupen ska bara stängas när användaren aktivt trycker "Hoppa över", "Skicka", eller klickar utanför

**I `GlobalFeedbackPopup.tsx`:**
```typescript
// Rad 95-98: Ta bort onClose() efter navigate
const handleViewConversation = () => {
  navigate(`/global-assistant?conversationId=${conversationId}`);
  // BORTTAGET: onClose();
};
```

---

## Problem 3: Timer för lång

**Nuvarande:** 60000ms (60 sekunder)
**Nytt:** 30000ms (30 sekunder)

---

## Teknisk implementation

### 1. `GlobalAssistant.tsx` - Lägg till URL-parameter hantering

```typescript
// Lägg till useSearchParams import
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

// Lägg till useEffect för att ladda konversation från URL
useEffect(() => {
  const loadConversationFromUrl = async () => {
    const urlParams = new URLSearchParams(location.search);
    const conversationIdFromUrl = urlParams.get("conversationId");
    
    if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
      // Hämta konversation från databasen
      const { data } = await supabase
        .from("assistant_conversations")
        .select("*")
        .eq("id", conversationIdFromUrl)
        .single();
      
      if (data) {
        setMessages(data.messages as Message[]);
        setContext(data.context as ConversationContext);
        setCurrentConversationId(data.id);
      }
    }
  };
  
  loadConversationFromUrl();
}, [location.search]);
```

### 2. `GlobalFeedbackPopup.tsx` - Behåll popup öppen

```typescript
// Ändra handleViewConversation (rad 95-98)
const handleViewConversation = () => {
  navigate(`/global-assistant?conversationId=${conversationId}`);
  // Ta bort: onClose();
};
```

### 3. `ConversationFeedbackContext.tsx` - Ta bort auto-stäng logik

```typescript
// Ta bort rad 59-65 helt:
// useEffect(() => {
//   if (location.pathname.includes("/global-assistant")) {
//     if (timerRef.current) clearTimeout(timerRef.current);
//     setShowPopup(false);
//   }
// }, [location.pathname]);
```

**Behåll dock timer-avbrytning** om användaren går till `/global-assistant` INNAN popupen visas (dvs medan timern tickar):

```typescript
// Ersätt med:
useEffect(() => {
  // Endast avbryt timer, stäng INTE popup
  if (location.pathname.includes("/global-assistant") && timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}, [location.pathname]);
```

### 4. `ConversationFeedbackContext.tsx` - Halvera timer

```typescript
// Ändra rad 48-50
timerRef.current = setTimeout(() => {
  setShowPopup(true);
}, 30000); // 30 sekunder istället för 60
```

---

## Sammanfattning av ändringar

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/pages/GlobalAssistant.tsx` | Lägg till logik för att läsa `conversationId` från URL och ladda konversation |
| 2 | `src/components/global-assistant/GlobalFeedbackPopup.tsx` | Ta bort `onClose()` i `handleViewConversation` |
| 3 | `src/contexts/ConversationFeedbackContext.tsx` | Ta bort auto-stäng av popup, ändra timer till 30s |

---

## Resultat

- Klick på "Visa konversationen" → navigerar till rätt konversation OCH feedback-popup stannar kvar
- Användaren kan se vilken konversation det gäller och sedan ge sin feedback
- Timer går på 30 sekunder istället för 60
