
# Plan: Chatthistorik för Global Assistant

## Sammanfattning

Användaren vill:
1. **Historik på alla chattar** - Möjlighet att se och återgå till tidigare konversationer
2. **Refresha/starta ny chatt** - Detta finns redan (+-knappen), men vi förbättrar flödet

## Design

### UI-layout

```text
┌─────────────────────────────────────────────────────────┐
│ [Historik-ikon]  Global Assistant  [+ Ny chatt]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Chattmeddelanden...                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Klick på Historik-ikon → Sheet öppnas från vänster:
┌────────────────────────┐
│ Chatthistorik          │
├────────────────────────┤
│ ○ Idag kl 14:32        │
│   "Visa mina projekt"  │
│                        │
│ ○ Igår kl 09:15        │
│   "Skapa offert..."    │
│                        │
│ ○ 3 feb 2026           │
│   "Hitta kund Mahad"   │
└────────────────────────┘
```

## Teknisk implementation

### Del 1: Databastabell för konversationer

Skapa ny tabell `assistant_conversations`:

```sql
CREATE TABLE assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON assistant_conversations FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_conversations_user_id ON assistant_conversations(user_id);
CREATE INDEX idx_conversations_updated ON assistant_conversations(updated_at DESC);
```

### Del 2: Typdefinitioner

Uppdatera `src/types/global-assistant.ts`:

```typescript
export interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  context: ConversationContext;
  created_at: string;
  updated_at: string;
}
```

### Del 3: Ny komponent - ChatHistorySidebar

Skapa `src/components/global-assistant/ChatHistorySidebar.tsx`:

- Visar lista över tidigare konversationer
- Grupperar efter datum (Idag, Igår, Denna vecka, Äldre)
- Visar titel baserat på första meddelandet
- Möjlighet att radera konversationer
- Klick laddar konversationen

### Del 4: Uppdatera GlobalAssistant.tsx

Huvudsakliga ändringar:

1. **State för konversationer**:
   ```typescript
   const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
   const [historyOpen, setHistoryOpen] = useState(false);
   ```

2. **Ladda/spara konversationer**:
   - Vid första meddelandet: skapa ny konversation i DB
   - Vid efterföljande meddelanden: uppdatera befintlig konversation
   - Auto-generera titel från första användarmeddelandet

3. **Ny chatt-funktion**:
   ```typescript
   const handleNewChat = () => {
     setMessages([]);
     setContext({});
     setCurrentConversationId(null); // Nollställ för att skapa ny vid nästa meddelande
   };
   ```

4. **Ladda konversation från historik**:
   ```typescript
   const handleLoadConversation = (conversation: Conversation) => {
     setMessages(conversation.messages);
     setContext(conversation.context);
     setCurrentConversationId(conversation.id);
     setHistoryOpen(false);
   };
   ```

### Del 5: Header med historik-knapp

```tsx
<div className="flex items-center justify-between border-b px-4 py-2.5">
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)}>
      <History className="h-4 w-4" />
    </Button>
    <Sparkles className="h-4 w-4 text-primary" />
    <span className="text-sm font-medium">Global Assistant</span>
  </div>
  <Button variant="ghost" size="icon" onClick={handleNewChat}>
    <Plus className="h-4 w-4" />
  </Button>
</div>

<ChatHistorySidebar 
  open={historyOpen} 
  onOpenChange={setHistoryOpen}
  onSelectConversation={handleLoadConversation}
  currentConversationId={currentConversationId}
/>
```

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `assistant_conversations` tabell | SKAPA: Databasmigration |
| `src/types/global-assistant.ts` | ÄNDRA: Lägg till Conversation interface |
| `src/components/global-assistant/ChatHistorySidebar.tsx` | SKAPA: Ny komponent |
| `src/pages/GlobalAssistant.tsx` | ÄNDRA: Integrera historik, spara/ladda konversationer |

## Autospar-logik

1. **Vid första meddelandet**: Skapa ny rad i `assistant_conversations`
2. **Vid efterföljande meddelanden**: Uppdatera `messages` och `context` i befintlig rad
3. **Titel**: Extraheras automatiskt från första användarmeddelandet (max 50 tecken)

## Resultat

| Före | Efter |
|------|-------|
| Chattar försvinner vid siduppdatering | Chattar sparas automatiskt |
| Ingen historik | Fullständig historik med sökmöjlighet |
| Bara + knapp för ny chatt | + knapp + historik-ikon i header |
