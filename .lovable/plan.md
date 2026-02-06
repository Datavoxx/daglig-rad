
# Plan: Fixa röstinspelning på mobil - Closure-bugg

## Problem

Röstinspelningen stoppar direkt på mobila enheter (men fungerar på desktop) på grund av ett **JavaScript closure-problem** i Web Speech API-hanteringen.

### Teknisk förklaring

När `startRecording()` körs:
1. `setIsRecording(true)` anropas
2. `recognition.onend` callback skapas - men den **fångar det gamla värdet** av `isRecording` (som var `false` när funktionen definierades)
3. På mobil triggar Web Speech API `onend` nästan omedelbart (p.g.a. striktare strömhantering)
4. Callback kollar `if (isRecording)` - men det är `false` (closure-värdet)!
5. Inspelningen återstartas **inte** → den stoppar direkt

### Varför det fungerar på desktop

Desktop-webbläsare är mer "generösa" och väntar längre innan de triggar `onend`. React hinner uppdatera state innan `onend` anropas första gången. På mobil är timing-fönstret mycket kortare.

---

## Lösning

Använd en **ref** (`useRef`) för att hålla reda på inspelningsstatus istället för att förlita sig på state i callbacks.

---

## Ändringar

### 1. VoiceInputOverlay.tsx

Lägg till `isRecordingRef` och synkronisera med state:

**Lägg till ny ref (efter rad 27):**
```typescript
const isRecordingRef = useRef(false);
```

**Uppdatera startRecording (rad 100-101):**
```typescript
recognitionRef.current = recognition;
recognition.start();
isRecordingRef.current = true;
setIsRecording(true);
```

**Fixa onend callback (rad 89-96):**
```typescript
recognition.onend = () => {
  if (isRecordingRef.current && recognitionRef.current) {
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started
    }
  }
};
```

**Uppdatera stopRecording (rad 107-108):**
```typescript
const stopRecording = () => {
  if (recognitionRef.current) {
    isRecordingRef.current = false;
    setIsRecording(false);
    // ...
```

**Uppdatera cancelRecording (rad 138-139):**
```typescript
const cancelRecording = () => {
  if (recognitionRef.current) {
    isRecordingRef.current = false;
    setIsRecording(false);
    // ...
```

### 2. InlineDiaryCreator.tsx

Samma mönster:

**Lägg till ny ref (efter rad ~91):**
```typescript
const isRecordingRef = useRef(false);
```

**Uppdatera startRecording (rad 207-208):**
```typescript
recognitionRef.current = recognition;
recognition.start();
isRecordingRef.current = true;
setIsRecording(true);
```

**Fixa onend callback (rad 195-203):**
```typescript
recognition.onend = () => {
  if (isRecordingRef.current) {
    try {
      recognition.start();
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      setInterimTranscript("");
    }
  }
};
```

**Uppdatera stopRecording (rad 219-221):**
```typescript
const stopRecording = () => {
  if (recognitionRef.current) {
    isRecordingRef.current = false;
    setIsRecording(false);
    // ...
```

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/shared/VoiceInputOverlay.tsx` | Lägg till `isRecordingRef` och använd i callbacks |
| `src/components/projects/InlineDiaryCreator.tsx` | Lägg till `isRecordingRef` och använd i callbacks |

---

## Resultat efter fix

- Röstinspelningen fungerar på **både mobil och desktop**
- Web Speech API:s automatiska `onend`-händelser hanteras korrekt
- Inspelningen återstartas automatiskt vid korta tystnader
- Ingen förändring i användarupplevelsen på desktop (där det redan fungerade)
