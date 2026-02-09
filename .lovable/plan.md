

## Mål

Få "Ny kund"-knappen att faktiskt skicka ett meddelande i chatten.

---

## Problem

`MessageList` har en `onSendMessage` prop men den skickas inte in från `GlobalAssistant.tsx`. Därför fungerar inte callback:en.

```text
Nuvarande flöde:
GlobalAssistant.tsx → MessageList (onSendMessage = undefined)
                          ↓
               EstimateFormCard (onCreateNewCustomer = () => undefined?.("..."))
                          ↓
                     Ingenting händer!
```

---

## Lösning

Skicka in `sendMessage`-funktionen till `MessageList` via `onSendMessage` prop.

```text
Nytt flöde:
GlobalAssistant.tsx → MessageList (onSendMessage = sendMessage)
                          ↓
               EstimateFormCard (onCreateNewCustomer = () => sendMessage("..."))
                          ↓
                     Meddelande skickas i chatten!
```

---

## Teknisk implementation

### Fil: `src/pages/GlobalAssistant.tsx`

**Ändring på rad 595** - Lägg till `onSendMessage` prop:

```tsx
<MessageList
  messages={messages}
  conversationId={currentConversationId}
  onProposalConfirm={handleProposalConfirm}
  // ... alla andra props ...
  onEstimateItemsFormOpen={handleEstimateItemsFormOpen}
  onSendMessage={sendMessage}  // ← LÄGG TILL DENNA
  isLoading={isLoading}
/>
```

---

## Sammanfattning

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `GlobalAssistant.tsx` | Skicka `sendMessage` till `MessageList` via `onSendMessage` prop |

---

## Resultat

- När man klickar på "Ny kund" i offertformuläret skickas meddelandet "Jag vill skapa en ny kund" direkt i chatten
- Assistenten svarar med kundflödet

