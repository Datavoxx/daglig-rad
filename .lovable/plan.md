

## Kompakt röst-UI överallt + exempelknapp i ÄTA

### Del 1: Kompakt VoicePromptButton i arbetsordrar

`ProjectWorkOrdersTab.tsx` (rad ~275-280) har fortfarande `agentAvatar` och default-variant. Ändra till `variant="compact"` och ta bort `agentAvatar`, precis som vi gjorde i ÄTA.

### Del 2: Kompakt VoiceFormSection i alla global-assistant-kort

`VoiceFormSection` (used i 7 formulärkort) har ett helt annat idle-utseende: en stor dashed-border box med ikon, rubrik, subtext och helstor knapp. Vi refaktorerar idle-state till en kompakt outline-knapp liknande VoicePromptButton compact-variant:

**Fil: `src/components/global-assistant/VoiceFormSection.tsx`**
- Byt ut idle-statens stora box (dashed border, ikon-cirkel, rubrik, description, helstor knapp, lightbulb-tip) mot en enkel outline-knapp med mikrofon-ikon och texten "Lat Byggio AI hjälpa dig"
- Behall recording/confirming/processing/completed-states som de är (de är redan kompakta nog)

### Del 3: Exempelknapp i ÄTA-dialogen

**Fil: `src/components/projects/ProjectAtaTab.tsx`**
- Lagg till en liten "Visa exempel"-knapp (Lightbulb-ikon) bredvid rubriken "Rader" eller nara "Lagg till rad"
- Klick fyller i formularet med ett realistiskt exempel:
  - Rad 1: Arbete, tim, "Rivning av befintlig vagg", antal 4, a-pris 450
  - Rad 2: Material, st, "Gipsskivor 13mm", antal 12, a-pris 89
  - Anledning: "Dolda rorledningar upptacktes vid rivning, kraver omlaggning"
  - Status: Vantande
- Knappen ar diskret (ghost/outline, liten) sa den inte star i vagen

### Teknisk sammanfattning

| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectWorkOrdersTab.tsx` | `variant="compact"`, ta bort `agentAvatar` |
| `src/components/global-assistant/VoiceFormSection.tsx` | Refaktorera idle-state till kompakt knapp |
| `src/components/projects/ProjectAtaTab.tsx` | Lagg till "Visa exempel"-knapp som fyller i exempeldata |

### Resultat
- Alla rost-UI:n i hela appen ar nu kompakta och minimalistiska
- ATA-dialogen har en diskret exempelknapp som visar hur en ifylld ATA ser ut

