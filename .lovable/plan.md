

## Plan: Lägg till real-time transkribering i alla röstinspelningar

### Bakgrund
Tre komponenter saknar real-time visning av transkriberad text under inspelning:

1. **ProjectPlanningTab** - Projektplanering inuti projekt
2. **CreateTemplateDialog** - Skapa ny kalkylmall
3. **TemplateEditor** - Redigera kalkylmall med röst

Övriga komponenter (InlineDiaryCreator, Planning.tsx, InspectionNew.tsx) har redan korrekt implementation.

### Lösning
Uppdatera de tre komponenterna till att:
1. Spåra interim-transkription med en `interimTranscript` state
2. Visa interim-texten i textfältet i realtid
3. Visa en "Lyssnar..."-indikator under inspelning

---

## Ändringar

### 1. ProjectPlanningTab.tsx

| Ändring | Detalj |
|---------|--------|
| Lägg till state | `interimTranscript` och `finalTranscriptRef` |
| Uppdatera `startRecording()` | Spara interim-resultat i state |
| Uppdatera `stopRecording()` | Rensa interim-state |
| Uppdatera Textarea | Visa `transcript + interimTranscript` |
| Lägg till indikator | "Lyssnar..." badge under inspelning |

#### Tekniska detaljer

Lägg till states (efter befintliga states):
```tsx
const [interimTranscript, setInterimTranscript] = useState("");
const finalTranscriptRef = useRef<string>("");
```

Uppdatera `startRecording()`:
```tsx
const startRecording = () => {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    toast({ title: "Taligenkänning stöds inte", variant: "destructive" });
    return;
  }

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "sv-SE";

  finalTranscriptRef.current = transcript;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = "";
    let final = "";
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        final += result[0].transcript + " ";
      } else {
        interim += result[0].transcript;
      }
    }

    if (final) {
      finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final.trim();
      setTranscript(finalTranscriptRef.current);
    }

    setInterimTranscript(interim);
  };

  recognition.onerror = () => {
    setIsRecording(false);
    setInterimTranscript("");
  };

  recognition.onend = () => {
    if (isRecording) {
      try { recognition.start(); } catch {}
    }
  };

  recognition.start();
  setIsRecording(true);
  (window as any).currentRecognition = recognition;
};
```

Uppdatera `stopRecording()`:
```tsx
const stopRecording = () => {
  if ((window as any).currentRecognition) {
    (window as any).currentRecognition.stop();
  }
  setIsRecording(false);
  setInterimTranscript("");
};
```

Uppdatera Textarea (rad 322-327):
```tsx
<div className="relative">
  <Textarea
    placeholder="Beskriv projektets faser..."
    value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
    onChange={(e) => {
      setTranscript(e.target.value);
      finalTranscriptRef.current = e.target.value;
    }}
    rows={6}
    disabled={isRecording}
  />
  {interimTranscript && (
    <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium animate-pulse">
      Lyssnar...
    </div>
  )}
</div>
```

---

### 2. CreateTemplateDialog.tsx

| Ändring | Detalj |
|---------|--------|
| Lägg till state | `interimTranscript` |
| Uppdatera `startRecording()` | Spara interim i state |
| Uppdatera `stopRecording()` | Rensa interim |
| Uppdatera Textarea | Visa interim i realtid |
| Lägg till indikator | "Lyssnar..." under Textarea |

#### Tekniska detaljer

Lägg till state:
```tsx
const [interimTranscript, setInterimTranscript] = useState("");
```

Uppdatera `startRecording()` - ändra `onresult`:
```tsx
recognitionRef.current.onresult = (event: any) => {
  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) {
      finalTranscript += event.results[i][0].transcript + " ";
    } else {
      interim += event.results[i][0].transcript;
    }
  }
  setTranscript(finalTranscript + interim);
  setInterimTranscript(interim);
};
```

Uppdatera `stopRecording()`:
```tsx
const stopRecording = () => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }
  setIsRecording(false);
  setInterimTranscript("");
};
```

Uppdatera inspelningsindikator (rad 201-205):
```tsx
{isRecording && (
  <div className="flex items-center gap-2 text-sm text-destructive animate-pulse">
    <span className="h-2 w-2 rounded-full bg-destructive" />
    Lyssnar...
    {interimTranscript && (
      <span className="text-muted-foreground italic truncate max-w-[200px]">
        "{interimTranscript}"
      </span>
    )}
  </div>
)}
```

---

### 3. TemplateEditor.tsx

| Ändring | Detalj |
|---------|--------|
| Aktivera `interimResults` | Ändra från `false` till `true` |
| Lägg till state | `interimTranscript` |
| Uppdatera `onresult` | Spara interim-text |
| Visa feedback | Lägg till real-time visning under inspelning |

#### Tekniska detaljer

Lägg till state:
```tsx
const [interimTranscript, setInterimTranscript] = useState("");
```

Ändra `interimResults` till `true` (rad 68):
```tsx
recognition.interimResults = true;
```

Uppdatera `onresult`:
```tsx
recognition.onresult = (event: SpeechRecognitionEvent) => {
  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) {
      transcriptRef.current += event.results[i][0].transcript + " ";
    } else {
      interim += event.results[i][0].transcript;
    }
  }
  setInterimTranscript(interim);
};
```

Uppdatera `stopVoiceEdit()`:
```tsx
const stopVoiceEdit = async () => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }
  setIsRecording(false);
  setInterimTranscript("");
  // ... resten av funktionen
};
```

Lägg till visning av interim-text i röstknappen (hitta röstknappen i JSX):
```tsx
{isRecording && interimTranscript && (
  <div className="text-xs text-muted-foreground italic animate-pulse mt-1">
    "{interimTranscript}"
  </div>
)}
```

---

## Resultat
Efter dessa ändringar kommer **alla** röstinspelningar i projektet att visa text i realtid medan användaren talar, precis som i offertbyggaren.

