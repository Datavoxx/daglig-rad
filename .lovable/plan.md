
## Förbättra offert-headern

### Problem
1. Headern ser "för mycket" ut -- för många element som trängs ihop
2. "KLAR"-badgen har grön text på grön bakgrund, dålig kontrast
3. Texten borde vara "GODKÄND" istället för "KLAR"

### Ändringar i `src/components/estimates/EstimateHeader.tsx`

#### 1. Byt "KLAR" till "GODKÄND"
- Ändra texten från `"KLAR"` till `"GODKÄND"` i badgen
- Uppdatera tooltip-texterna att matcha ("markera som godkänd" / "ändra till utkast")

#### 2. Förbättra "GODKÄND"-badgens design
- Byt från hel grön bakgrund (`bg-green-600`) till en mer subtil stil:
  - Ljusgrön bakgrund (`bg-emerald-50`) med mörkgrön text (`text-emerald-700`) och tunn border (`border-emerald-200`)
  - Vit text på solid grön bakgrund ser dåligt ut -- subtilare variant matchar resten av designen bättre
- Samma stil som befintliga `success`-varianten i badge-komponenten

#### 3. Rensa upp layouten
- Ta bort den separata "Starta projekt"-knappen (knappen duplicerar badgens funktion)
- Flytta offertnummer och version/datum till en mer kompakt rad under titeln istället för till höger
- Minska visuellt brus genom att kombinera meta-info i en enda rad med kund och adress

### Resultat
Headern blir renare med färre visuella element. Badgen "GODKÄND" blir läsbar med bra kontrast (mörk text på ljus bakgrund istället för vit text på grön bakgrund).

### Teknisk sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/EstimateHeader.tsx` | Byt "KLAR" -> "GODKÄND", förbättra badge-stil, ta bort "Starta projekt"-knapp, rensa layout |
