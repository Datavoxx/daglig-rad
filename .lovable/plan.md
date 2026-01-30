

## Plan: Rekommendation att starta projekt efter sparad offert

### Översikt
När användaren sparar en offert (markerar som klar) visas en dialog som rekommenderar att starta ett projekt med den offerten. Detta snabbar upp arbetsflödet från offert till projekt.

---

### Ändringar i `src/components/estimates/EstimateBuilder.tsx`

**1. Lägg till ny state för rekommendationsdialog (rad ~55):**
```tsx
const [showProjectRecommendation, setShowProjectRecommendation] = useState(false);
const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);
```

**2. Uppdatera `handleSaveAsCompleted` för att visa dialog efter framgångsrik sparning:**

Problemet är att `save()` inte returnerar estimateId direkt. Vi behöver använda `saveMutation.mutateAsync` istället.

Uppdatera useEstimate för att returnera `saveAsync`:
```tsx
// I useEstimate.ts
saveAsync: saveMutation.mutateAsync,
```

Sedan i `handleSaveAsCompleted`:
```tsx
const handleSaveAsCompleted = async () => {
  estimate.updateStatus("completed");
  try {
    const estimateId = await estimate.saveAsync();
    setSavedEstimateId(estimateId);
    setShowProjectRecommendation(true);
  } catch (error) {
    // Error handled by mutation
  }
};
```

**3. Lägg till import för `useNavigate`:**
```tsx
import { useNavigate } from "react-router-dom";
```

**4. Lägg till navigate-hook:**
```tsx
const navigate = useNavigate();
```

**5. Lägg till rekommendationsdialog:**
```tsx
<AlertDialog open={showProjectRecommendation} onOpenChange={setShowProjectRecommendation}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <FolderPlus className="h-5 w-5 text-primary" />
        Starta projekt?
      </AlertDialogTitle>
      <AlertDialogDescription>
        Offerten är sparad! Vill du direkt skapa ett projekt från denna offert? 
        Det gör att du snabbt kan börja planera och hantera arbetet.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Inte nu</AlertDialogCancel>
      <AlertDialogAction 
        onClick={() => {
          navigate(`/projects?createFrom=${savedEstimateId}`);
        }}
      >
        Skapa projekt
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**6. Lägg till import för `FolderPlus`:**
```tsx
import { ..., FolderPlus } from "lucide-react";
```

---

### Ändringar i `src/hooks/useEstimate.ts`

**Lägg till `saveAsync` i return-objektet (rad ~566):**
```tsx
return {
  // ...existing
  save: saveMutation.mutate,
  saveAsync: saveMutation.mutateAsync, // NY
  isSaving: saveMutation.isPending,
  // ...
};
```

---

### Ändringar i `src/pages/Projects.tsx`

**1. Lägg till automatisk dialog-öppning vid `createFrom` query-param:**

```tsx
import { useNavigate, useSearchParams } from "react-router-dom";

// I komponenten:
const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  const createFromId = searchParams.get("createFrom");
  if (createFromId && !loading && estimates.length > 0) {
    const estimateExists = estimates.find(e => e.id === createFromId);
    if (estimateExists) {
      setSelectedEstimateId(createFromId);
      setDialogOpen(true);
      // Clear the query param
      searchParams.delete("createFrom");
      setSearchParams(searchParams, { replace: true });
    }
  }
}, [searchParams, loading, estimates]);
```

---

### Visuell förändring

**Efter att användaren klickar Spara:**
```
┌─────────────────────────────────────────────────────┐
│  📁 Starta projekt?                                │
│                                                     │
│  Offerten är sparad! Vill du direkt skapa ett      │
│  projekt från denna offert? Det gör att du snabbt  │
│  kan börja planera och hantera arbetet.            │
│                                                     │
│                    [Inte nu]  [Skapa projekt]      │
└─────────────────────────────────────────────────────┘
```

---

### Sammanfattning

| Fil | Ändring |
|-----|---------|
| `useEstimate.ts` | Lägg till `saveAsync` i return |
| `EstimateBuilder.tsx` | Ny state, uppdaterad save-handler, ny dialog, imports |
| `Projects.tsx` | Hantera `createFrom` query-param för att förifyla dialog |

---

### Resultat

- Efter sparning visas en rekommendation att starta projekt
- Klickar användaren "Skapa projekt" navigeras de till projektsidan med dialogen förifylld
- Klickar de "Inte nu" stängs dialogen och de stannar kvar i offerten
- Smidigare arbetsflöde från försäljning till produktion

