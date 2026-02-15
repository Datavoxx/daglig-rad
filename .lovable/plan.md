

## Mjukare dialog-animation vid redigering av ÄTA

### Vad ändras
Dialogen som öppnas vid klick på redigera-knappen (Pencil) ska animeras smidigare. Standard `DialogContent` använder en snabb zoom+fade som kan kännas abrupt. Vi förbättrar detta genom att lägga till mjukare CSS-transitions.

### Teknisk ändring i `src/components/ui/dialog.tsx`

Uppdatera `DialogContent`-komponentens animationsklasser (rad 37-40):
- Byt ut de snabba `zoom-in/out-95` och `slide-out/in`-animationerna mot längre, mjukare varianter
- Ändra `duration-200` till `duration-300` för en långsammare, smidigare känsla
- Byt easing från default till `ease-out` för öppning
- Lägg till en subtilare scale-effekt: `data-[state=closed]:scale-[0.98] data-[state=open]:scale-100` istället för `zoom-out-95/zoom-in-95`

Uppdatera `DialogOverlay` (rad 22-25):
- Ändra overlay-animationen till `duration-300` för att matcha content-animationen

### Resultat
Dialogen glider in mjukare med en subtilare skalning och längre duration, vilket ger en mer polerad upplevelse oavsett om man skapar ny ÄTA eller redigerar en befintlig.
