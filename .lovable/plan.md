
# Plan: Kompaktera bokningsdialogen

## Mål
Gör formuläret mindre och mer kompakt så att det ryms utan scrollning.

---

## Ändringar i TrainingBookingDialog.tsx

### 1. Minska spacing mellan sektioner
- `space-y-6` blir `space-y-4`
- `space-y-4` blir `space-y-3`
- `space-y-3` blir `space-y-2`

### 2. Kompaktera DurationCard
- Minska padding från `p-4 sm:p-5` till `p-3`
- Ta bort subtitle-texten (den extra beskrivningen)
- Mindre border-radius: `rounded-2xl` till `rounded-xl`

### 3. Kompaktera DayPill
- Minska min-width från `64px` till `52px`
- Minska padding från `p-3` till `p-2`
- Mindre border-radius: `rounded-2xl` till `rounded-xl`
- Visa endast 7 dagar istället för 10

### 4. Kompaktera TimeButton
- Minska padding från `p-3` till `py-2 px-3`
- Mindre border-radius: `rounded-2xl` till `rounded-xl`

### 5. Kompaktera Input-fält
- Minska spacing från `space-y-2` till `space-y-1`
- Ta bort margin-top på form (`mt-4` blir `mt-2`)

### 6. Minska dialog header
- Minska title från `text-xl` till `text-lg`

### 7. Ta bort "Obligatoriskt"-text
- Onödigt visuellt brus - knappen är redan disabled

---

## Resultat

| Element | Före | Efter |
|---------|------|-------|
| Form spacing | space-y-6 | space-y-4 |
| Duration card padding | p-4/p-5 | p-3 |
| Day pill min-width | 64px | 52px |
| Day pill padding | p-3 | p-2 |
| Time button padding | p-3 | py-2 px-3 |
| Antal dagar visade | 10 | 7 |
| Border-radius | rounded-2xl | rounded-xl |

---

## Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/landing/TrainingBookingDialog.tsx` | Kompaktare layout |
