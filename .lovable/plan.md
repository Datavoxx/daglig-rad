
# Plan: Fixa röstinspelning på iPhone Safari

## Problemidentifikation

iOS Safari har **begränsat stöd för Web Speech API**:
- `continuous: true` fungerar INTE på iOS
- Sessionen avslutas automatiskt efter ~5-10 sekunder
- `onend`-händelser triggas aggressivt

Detta förklarar varför röstinspelningen fungerar på desktop men inte på iPhone.

## Lösning: Hybridmetod

Implementera en tvådelad strategi:

| Platform | Metod |
|----------|-------|
| Desktop (Chrome/Edge) | Web Speech API (funkar utmärkt) |
| iOS Safari | MediaRecorder + AI-transkribering via edge function |

## Teknisk Implementation

### Del 1: Skapa iOS-detektering

Lägg till en hjälpfunktion för att detektera iOS:

```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOSSafari = isIOS || (isSafari && 'ontouchend' in document);
```

### Del 2: Uppdatera transkriberings-edge function

Edge-funktionen `transcribe-audio` finns redan och använder Lovable AI Gateway. Behöver bara säkerställa att den fungerar med iPhone-inspelat ljud.

### Del 3: Uppdatera röstkomponenter

Alla komponenter med röstinspelning får en ny logik:

**VoiceInputOverlay.tsx** (huvudkomponent för Saga):
- iOS: Använd MediaRecorder → base64 ljud → transcribe-audio edge function
- Desktop: Befintlig Web Speech API

**VoicePromptButton.tsx**:
- Samma hybridlogik

**InlineDiaryCreator.tsx** (Ulla):
- Samma hybridlogik

**Planning.tsx** (Bo):
- Samma hybridlogik + fixa isRecordingRef

**InspectionNew.tsx**:
- Samma hybridlogik + fixa isRecordingRef

**ProjectPlanningTab.tsx**:
- Samma hybridlogik + fixa isRecordingRef

**CreateTemplateDialog.tsx**:
- Samma hybridlogik

**TemplateEditor.tsx**:
- Samma hybridlogik

## Filer som ändras

| Fil | Ändringar |
|-----|-----------|
| `src/components/shared/VoiceInputOverlay.tsx` | Lägg till iOS-fallback med MediaRecorder + transcribe-audio |
| `src/components/shared/VoicePromptButton.tsx` | Lägg till isRecordingRef + iOS-fallback |
| `src/components/projects/InlineDiaryCreator.tsx` | Lägg till iOS-fallback |
| `src/pages/Planning.tsx` | Lägg till isRecordingRef + iOS-fallback |
| `src/pages/InspectionNew.tsx` | Lägg till isRecordingRef + iOS-fallback |
| `src/components/projects/ProjectPlanningTab.tsx` | Lägg till isRecordingRef + iOS-fallback |
| `src/components/estimates/CreateTemplateDialog.tsx` | Lägg till iOS-fallback |
| `src/components/estimates/TemplateEditor.tsx` | Lägg till isRecordingRef + iOS-fallback |

## Nytt flöde för iOS

```text
1. Användaren trycker "Spela in"
2. System detekterar iOS Safari
3. MediaRecorder startar (spelar in ljud som webm/mp4)
4. Användaren pratar...
5. Användaren trycker "Stoppa"
6. Ljud konverteras till base64
7. Anrop till transcribe-audio edge function
8. AI transkriberar ljud → text returneras
9. Text visas i bekräftelsedialogrutan
```

## Resultat efter fix

- Röstinspelning fungerar på **iPhone Safari** (via AI-transkribering)
- Röstinspelning fortsätter fungera på **desktop** (via Web Speech API)
- Saga, Bo och Ulla fungerar på alla plattformar
- Samma användarupplevelse oavsett enhet
