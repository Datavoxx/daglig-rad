

## Minimalistisk röst-knapp i ÄTA-dialogen

### Problem
Röstinspelningsknappen (VoicePromptButton) i "Ny ÄTA"-dialogen använder `default`-varianten som renderar en stor yta med streckad ram, stor avatar-bild (128x128), och extra text. Den tar onödigt mycket plats.

### Lösning
Byt till `compact`-varianten av VoicePromptButton i ÄTA-dialogen. Denna variant renderar en enkel, smal knapp med ikon och text -- ingen stor bild, ingen streckad ram, ingen subtext. Modern och minimalistisk.

### Ändring i `src/components/projects/ProjectAtaTab.tsx`

Rad ~441-446: Ändra VoicePromptButton från default-variant till compact-variant och ta bort `agentAvatar`-proppen (det är avataren som tar mest plats):

```
<VoicePromptButton
  onTranscriptComplete={handleVoiceInput}
  isProcessing={isVoiceProcessing}
  agentName="Byggio AI"
  variant="compact"
/>
```

### Resultat
Istället for en stor dashed-border box med 128px avatar-bild visas en enkel outline-knapp med mikrofon-ikon och texten "Låt Byggio AI hjälpa dig" -- tar en enda rad istället for ~150px vertikal yta.

