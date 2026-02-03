
## Sammanfattning: Textredigering innan "Kör kommando"

### Nuvarande läge per komponent

| Komponent | Redigerbar text? | Bekräfta-steg? | Status |
|-----------|------------------|----------------|--------|
| **VoiceInputOverlay** | ❌ Nej | ✅ Ja | Saknar redigering |
| **VoicePromptButton** | ❌ Nej | ✅ Ja | Saknar redigering |
| **ProjectPlanningTab** | ✅ Ja (Textarea) | ❌ Nej | OK - går direkt till "Generera plan" |
| **InlineDiaryCreator** | ✅ Ja (Textarea) | ❌ Nej | OK - går direkt till "Generera rapport" |
| **Planning.tsx** | ✅ Ja (Textarea) | ❌ Nej | OK - går direkt till "Generera plan" |
| **InspectionNew.tsx** | ✅ Ja (Textarea) | ❌ Nej | OK - går direkt till "Analysera" |
| **CreateTemplateDialog** | ✅ Ja (Textarea) | ❌ Nej | OK - går direkt till "Generera mall" |
| **TemplateEditor** | ❌ Nej | ❌ Nej | **Kritisk brist** |

---

## Problem

De två delande röstkomponenterna (**VoiceInputOverlay** och **VoicePromptButton**) visar transkriberingen i bekräftelsedialogen, men texten går inte att redigera innan man trycker "Kör kommando".

**TemplateEditor** har ett extra problem: den skickar transkripten direkt till AI:n utan något bekräftelsesteg alls.

---

## Lösning

### 1. VoiceInputOverlay – Lägg till Textarea i bekräftelsevyn

Byt ut den statiska texten i bekräftelsedialog mot en redigerbar Textarea.

**Fil:** `src/components/shared/VoiceInputOverlay.tsx`

**Ändring (rad 167-169):**
```tsx
// Före:
<p className="font-medium mb-1">Du sa:</p>
<p className="text-muted-foreground">"{finalTranscript}"</p>

// Efter:
<p className="font-medium mb-1">Redigera vid behov:</p>
<Textarea
  value={finalTranscript}
  onChange={(e) => {
    setFinalTranscript(e.target.value);
    finalTranscriptRef.current = e.target.value;
  }}
  className="min-h-[80px] resize-none"
  autoFocus
/>
```

**Ytterligare ändringar:**
- Importera `Textarea` från `@/components/ui/textarea`
- Inga andra strukturella ändringar behövs

---

### 2. VoicePromptButton – Lägg till Textarea i bekräftelsevyn

Samma mönster som VoiceInputOverlay.

**Fil:** `src/components/shared/VoicePromptButton.tsx`

**Ändring (rad 154-156):**
```tsx
// Före:
<p className="font-medium mb-1">Du sa:</p>
<p className="text-muted-foreground">"{finalTranscript}"</p>

// Efter:
<p className="font-medium mb-1">Redigera vid behov:</p>
<Textarea
  value={finalTranscript}
  onChange={(e) => {
    setFinalTranscript(e.target.value);
    finalTranscriptRef.current = e.target.value;
  }}
  className="min-h-[80px] resize-none"
  autoFocus
/>
```

**Ytterligare ändringar:**
- Importera `Textarea` från `@/components/ui/textarea`

---

### 3. TemplateEditor – Lägg till bekräftelsesteg med redigerbar text

Denna komponent har inget bekräftelsesteg alls – den skickar direkt till AI:n.

**Fil:** `src/components/estimates/TemplateEditor.tsx`

**Ändringar:**

1. Lägg till state för bekräftelsesteg:
```tsx
const [pendingTranscript, setPendingTranscript] = useState("");
const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
```

2. Uppdatera `stopVoiceEdit()` att visa bekräftelse istället för att köra direkt:
```tsx
const stopVoiceEdit = () => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }
  setIsRecording(false);
  setInterimTranscript("");

  const transcript = transcriptRef.current.trim();
  if (!transcript) {
    toast.info("Ingen röst inspelad");
    return;
  }

  // Visa bekräftelsedialog istället för att köra direkt
  setPendingTranscript(transcript);
  setShowVoiceConfirmation(true);
};
```

3. Lägg till ny funktion för att köra kommandot:
```tsx
const executeVoiceCommand = async () => {
  setShowVoiceConfirmation(false);
  setIsProcessingVoice(true);
  
  try {
    const { data, error } = await supabase.functions.invoke("apply-voice-edits", {
      body: {
        transcript: pendingTranscript,
        currentData: editedTemplate,
        documentType: "template",
      },
    });

    if (error) throw error;

    if (data && typeof data === "object") {
      setEditedTemplate(data);
      toast.success("Ändringarna har applicerats");
    }
  } catch (error: any) {
    console.error("Voice edit error:", error);
    toast.error("Kunde inte tolka röständringarna");
  } finally {
    setIsProcessingVoice(false);
    setPendingTranscript("");
  }
};

const cancelVoiceCommand = () => {
  setShowVoiceConfirmation(false);
  setPendingTranscript("");
  toast.info("Kommando avbrutet");
};
```

4. Lägg till bekräftelsedialog i JSX (med redigerbar Textarea):
```tsx
{showVoiceConfirmation && (
  <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3 mb-4">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Bekräfta röstkommando</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelVoiceCommand}>
        <X className="h-4 w-4" />
      </Button>
    </div>
    <div className="space-y-2">
      <p className="text-sm font-medium">Redigera vid behov:</p>
      <Textarea
        value={pendingTranscript}
        onChange={(e) => setPendingTranscript(e.target.value)}
        className="min-h-[80px] resize-none"
        autoFocus
      />
    </div>
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" onClick={cancelVoiceCommand}>
        Avbryt
      </Button>
      <Button className="flex-1" onClick={executeVoiceCommand} disabled={isProcessingVoice}>
        {isProcessingVoice ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Bearbetar...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Kör kommando
          </>
        )}
      </Button>
    </div>
  </div>
)}
```

---

## Sammanfattning av filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/components/shared/VoiceInputOverlay.tsx` | Byt statisk text mot Textarea i bekräftelsevyn |
| `src/components/shared/VoicePromptButton.tsx` | Byt statisk text mot Textarea i bekräftelsevyn |
| `src/components/estimates/TemplateEditor.tsx` | Lägg till bekräftelsesteg med redigerbar Textarea |

---

## Resultat

Efter dessa ändringar kommer **alla** röstinspelningar att:
1. Visa transkriberingen efter inspelning
2. Låta användaren **redigera texten** innan den skickas
3. Kräva bekräftelse ("Kör kommando") innan AI:n bearbetar ändringarna

Detta ger konsekvent beteende i hela appen och ger användarna full kontroll över vad som skickas till AI:n.
