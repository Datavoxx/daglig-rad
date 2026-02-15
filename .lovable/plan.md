

## Förenkla spara-flödet och lägg till "Starta projekt"

### Problem
1. "Spara som utkast"-knappen är meningslös eftersom offerten auto-sparas direkt
2. Det saknas en "Starta projekt"-knapp i headern
3. Dialogen som visas vid godkännande har fel text ("Offerten är sparad!" -- det sker ju redan automatiskt)

### Ändringar

#### 1. Förenkla spara-knapparna (`StickyTotals.tsx`)
- Ta bort dropdown-menyn med "Spara som draft" / "Markera som klar"
- Ersätt med en enkel "Spara"-knapp (sparar aktuellt tillstand)
- Behall "Ladda ner"-knappen som den är

#### 2. Lägg till "Starta projekt"-knapp i headern (`EstimateBuilder.tsx`)
- Lägg till en "Starta projekt"-knapp bland action-knapparna i headern (bredvid spara/radera)
- Knappen visas bara när offerten har status "completed" (godkänd)
- Klick öppnar samma dialog som redan finns, men med bättre text

#### 3. Förbättra dialog-texten (`EstimateBuilder.tsx`)
- Ändra beskrivningen från "Offerten är sparad! Vill du direkt skapa ett projekt..." 
- Till: "Nu när offerten är godkänd, vill du gå vidare och starta ett projekt? Det gör att du snabbt kan börja planera och hantera arbetet."

### Teknisk sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/StickyTotals.tsx` | Ta bort dropdown, ersätt med enkel spara-knapp |
| `src/components/estimates/EstimateBuilder.tsx` | Lägg till "Starta projekt"-knapp i headern, förbättra dialogtext |

