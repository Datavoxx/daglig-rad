

## Plan: Ersätt Sagas avatar med transparent version

### Problem
Den nuvarande `src/assets/saga-avatar.png` visar fortfarande den gamla bilden med vit bakgrund/ram. Den nya transparenta bilden har inte kopierats korrekt.

### Lösning
Kopiera den uppladdade filen `ChatGPT_Image_2_feb._2026_23_21_44-removebg-preview-3.png` till `src/assets/saga-avatar.png` och ersätt den befintliga filen.

### Åtgärd

| Fil | Åtgärd |
|-----|--------|
| `src/assets/saga-avatar.png` | Ersätt med `user-uploads://ChatGPT_Image_2_feb._2026_23_21_44-removebg-preview-3.png` |

### Teknisk detalj
Använder `lov-copy` för att kopiera från `user-uploads://` till `src/assets/saga-avatar.png`, vilket överskriver den befintliga filen.

### Resultat
Saga kommer att visas med transparent bakgrund, precis som Bo och Ulla.

