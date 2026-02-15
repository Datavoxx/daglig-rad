
## Förbättra "Starta projekt"-knappen och lägg till "Ångra godkänd"

### Nuvarande beteende
- "Starta projekt"-knappen syns bara när offerten är godkänd
- Det finns inget tydligt sätt att gå tillbaka från godkänd till draft

### Nytt beteende

**När status = DRAFT:**
- "Starta projekt"-knappen syns och fungerar som genväg: den sätter automatiskt status till "completed" (godkänd), sparar, och visar "Starta projekt?"-dialogen

**När status = GODKÄND:**
- "Starta projekt"-knappen syns fortfarande (samma funktion, sparar och visar dialogen)
- En ny knapp "Ångra godkänd" dyker upp bredvid, som ändrar status tillbaka till draft

### Teknisk sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Visa "Starta projekt" oavsett status (auto-godkänn vid draft). Lägg till "Ångra godkänd"-knapp som syns vid status completed. |

### Detaljerade ändringar i `EstimateBuilder.tsx`

1. **"Starta projekt"-knappen** (rad ~390-406): Ta bort villkoret `status === "completed"` -- knappen visas alltid. Vid klick: om status är draft, kör `handleSaveAsCompleted()` (sätter godkänd + sparar + visar dialog). Om redan godkänd, spara och visa dialog direkt.

2. **Ny "Ångra godkänd"-knapp**: Läggs till bredvid "Starta projekt", visas bara vid `status === "completed"`. Klick kör `handleStatusChange("draft")` som redan finns och fungerar (sätter draft + sparar + visar toast).
