

## Problem

When a user clicks a quick-reply button (e.g., "Skapa offert") and navigates away before the AI response arrives, the feedback popup never triggers. This is because:

1. `currentConversationId` is only set **after** the assistant responds and the conversation is saved to the database
2. If the user leaves before that, `conversationIdRef.current` is still `null`
3. The cleanup check requires both `conversationIdRef.current` (not null) **and** `messagesLengthRef.current > 1`

## Solution

Change the cleanup logic in `GlobalAssistant.tsx` to **eagerly create the conversation** as soon as the user sends their first message, rather than waiting for the assistant's response. This ensures `currentConversationId` is set before the user can navigate away.

## Changes

### 1. `src/pages/GlobalAssistant.tsx` -- Eagerly save conversation on user message

In the `sendMessage` function, move the `saveConversation` call to happen right after adding the user message (before waiting for the AI response). This way, the conversation ID is available immediately.

Specifically:
- After creating `userMessage` and before invoking the edge function, call `saveConversation` with just the user message
- Store the returned conversation ID so the cleanup effect can use it
- The existing save after the assistant responds will then **update** the conversation (since it already has an ID)

### 2. `src/pages/GlobalAssistant.tsx` -- Lower the message threshold

Change the cleanup condition from `messagesLengthRef.current > 1` to `messagesLengthRef.current > 0` so that even a single sent message (before assistant responds) is enough to trigger the feedback flow.

## Technical Details

```text
Current flow:
  User clicks button -> sendMessage() -> [userMsg, loadingMsg] added
    -> await edge function -> assistant response -> saveConversation() -> conversationId set
    -> User navigates away -> cleanup checks conversationId (null if left early) -> NO feedback

New flow:
  User clicks button -> sendMessage() -> [userMsg, loadingMsg] added
    -> saveConversation(userMsg) -> conversationId set immediately
    -> User navigates away -> cleanup checks conversationId (set!) -> feedback triggers
```

This is a minimal change (around 10 lines modified) in a single file.
