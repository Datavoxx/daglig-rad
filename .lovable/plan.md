
# Plan: Dynamiska tidsintervall baserat på utbildningslängd

## Mål
Visa tidsalternativ i 30-minutersintervall när "30 min" är valt och i 1-timmesintervall när "60 min" är valt.

---

## Nuvarande implementation

```typescript
const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];
```

Statisk array med 1-timmesintervall som alltid visas oavsett vald längd.

---

## Ändringar i TrainingBookingDialog.tsx

### 1. Ersätt statisk array med två varianter

```typescript
const timeSlots30min = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"
];

const timeSlots60min = [
  "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"
];
```

### 2. Skapa dynamisk timeSlots baserat på trainingDuration

Använd `useMemo` för att välja rätt array:

```typescript
const timeSlots = useMemo(() => {
  return trainingDuration === "30 min" ? timeSlots30min : timeSlots60min;
}, [trainingDuration]);
```

### 3. Nollställ vald tid när duration ändras

Lägg till effekt som rensar `selectedTime` när användaren byter mellan 30/60 min:

```typescript
// I onValueChange för RadioGroup:
onValueChange={(value) => {
  setValue("training_duration", value as "30 min" | "60 min");
  setSelectedTime(null); // Nollställ tid när duration ändras
}}
```

### 4. Justera grid för fler knappar

Ändra från 3 kolumner till 4 för att passa fler tider:

```typescript
<div className="grid grid-cols-4 gap-1.5">
```

---

## Resultat

| Duration | Tider som visas |
|----------|-----------------|
| 30 min | 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 13:00, 13:30, 14:00, 14:30, 15:00, 15:30 |
| 60 min | 09:00, 10:00, 11:00, 13:00, 14:00, 15:00 |

---

## Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/landing/TrainingBookingDialog.tsx` | Dynamiska tidsintervall baserat på vald utbildningslängd |
