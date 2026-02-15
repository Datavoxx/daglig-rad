
## Exempel-panel istället för att fylla i formuläret

### Vad ändras
"Visa exempel"-knappen ska inte längre fylla i de riktiga fälten. Istället togglar den en separat illustrationspanel som visar hur ett ifyllt ÄTA-formulär ser ut. Användaren kan stänga panelen när de har sett exemplet.

### Teknisk ändring i `src/components/projects/ProjectAtaTab.tsx`

1. **Ny state-variabel**: `const [showExample, setShowExample] = useState(false)`

2. **Ändra knappen** (rad ~460-484): Byt `onClick` från att fylla i formuläret till att toggla `showExample`. Knappens text växlar mellan "Visa exempel" och "Dölj exempel".

3. **Ny exempel-panel** (visas mellan knappen och rubrikraden, rad ~485): En collapsible ruta med `bg-blue-50 border border-blue-200 rounded-lg` som innehåller:
   - Rubrik: "Exempel på ifylld ÄTA"
   - Två exempelrader i samma grid-layout som de riktiga raderna, men som ren text (ej input-fält):
     - Rad 1: Arbete | tim | Rivning av befintlig vägg | 4 | 450 kr
     - Rad 2: Material | st | Gipsskivor 13mm | 12 | 89 kr
   - Exempelanledning: "Dolda rörledningar upptäcktes vid rivning, kräver omläggning"
   - En liten "Stäng"-knapp (X) i hörnet

4. **Ta bort gammal logik**: Ta bort koden som sätter `setFormRows`, `setFormReason`, `setFormStatus` i knappens onClick.

### Utseende
Panelen är visuellt distinkt (lätt blå bakgrund) så det är tydligt att det är ett exempel och inte det riktiga formuläret. Den ligger ovanför de riktiga raderna och försvinner när användaren klickar "Dölj exempel" eller X-knappen.
