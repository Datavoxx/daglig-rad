

## Plan: Fixa "Rendered more hooks" felet i ProjectPlanningTab

### Problemet
`useIsMobile()` hooken anropas på rad 401, **efter** flera tidiga `return`-satser. React kräver att alla hooks anropas i samma ordning vid varje rendering, och att de alltid anropas (aldrig villkorligt).

### Lösningen
Flytta `useIsMobile()` till toppen av komponenten, tillsammans med de andra hooksen, **före** alla tidiga returns.

### Ändringar

| Fil | Rad | Ändring |
|-----|-----|---------|
| `ProjectPlanningTab.tsx` | 81 | Lägg till `const isMobile = useIsMobile();` här |
| `ProjectPlanningTab.tsx` | 401 | Ta bort `const isMobile = useIsMobile();` |

### Teknisk detalj

**Före (felaktigt):**
```tsx
// Rad 69-81: Hooks i början
const [viewState, setViewState] = useState<ViewState>("empty");
// ... fler hooks
const { toast } = useToast();

// Rad 292-398: Tidiga returns
if (viewState === "empty") { return <Card>...</Card>; }
if (viewState === "input") { return <div>...</div>; }
if (viewState === "generating") { return <Card>...</Card>; }
if (viewState === "review") { return <PlanEditor .../>; }

// Rad 401: PROBLEM - Hook anropas EFTER returns!
const isMobile = useIsMobile();  // <-- Kraschar!
```

**Efter (korrekt):**
```tsx
// Rad 69-82: ALLA hooks i början
const [viewState, setViewState] = useState<ViewState>("empty");
// ... fler hooks
const { toast } = useToast();
const isMobile = useIsMobile();  // <-- Flyttad hit!

// Rad 292-398: Tidiga returns (nu säkra)
if (viewState === "empty") { return <Card>...</Card>; }
// ...

// Rad 401: Ingen hook här längre
// const isMobile = useIsMobile(); <-- BORTTAGEN
```

### Varför detta fungerar
- Alla hooks anropas nu **alltid** och i **samma ordning**
- De tidiga `return`-satserna påverkar inte längre hook-anropen
- React kan korrekt spåra vilken state/effect som hör till vilken hook

### Resultat
Efter denna ändring kommer projektplaneringen att fungera korrekt utan krasch när du växlar mellan lägen (empty → input → view).

