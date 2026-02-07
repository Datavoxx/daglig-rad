

# Plan: Visa "Ny chatt"-knappen alltid

## Problem

"Ny chatt"-knappen (Plus-ikonen) visas **endast när det finns meddelanden** i chatten. I tomt läge är den dold, vilket kan vara förvirrande.

## Lösning

Ändra så att knappen alltid syns, men antingen:
- **Alternativ A**: Alltid visa knappen (även i tomt läge)
- **Alternativ B**: Visa knappen endast när det finns meddelanden (nuvarande beteende är tekniskt korrekt - det behövs ingen "ny chatt" om chatten redan är tom)

## Rekommendation

**Alternativ B är korrekt beteende** - det finns ingen anledning att visa en "Ny chatt"-knapp när chatten redan är tom. 

Men om du vill att knappen alltid ska synas (för konsistens), kan vi ta bort villkoret `hasMessages &&`.

## Teknisk ändring (om du vill alltid visa knappen)

Fil: `src/pages/GlobalAssistant.tsx` (rad 248-258)

```typescript
// FÖRE:
{hasMessages && (
  <Button ... onClick={handleNewChat}>
    <Plus className="h-4 w-4" />
  </Button>
)}

// EFTER:
<Button 
  variant="ghost"
  size="icon"
  onClick={handleNewChat}
  className="h-8 w-8"
  title="Ny chatt"
  disabled={!hasMessages}  // Inaktiverad om redan tom
>
  <Plus className="h-4 w-4" />
</Button>
```

## Sammanfattning

| Nuvarande | Förslag |
|-----------|---------|
| Knappen döljs helt i tomt läge | Knappen visas alltid men är `disabled` när tom |

