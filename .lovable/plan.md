
## Plan: Ta bort "Vilka är Byggio?" sektionen från Auth-sidan

### Översikt
Ta bort den kollapsibla "Vilka är Byggio?" kortet som visas ovanför inloggningsformuläret på /auth-sidan.

---

### Ändringar i `src/pages/Auth.tsx`

**1. Ta bort oanvända importer (rad 3-4):**
- `ChevronDown` från lucide-react
- `Collapsible, CollapsibleContent, CollapsibleTrigger` från ui/collapsible
- `cn` från lib/utils

**2. Ta bort state (rad 23):**
```tsx
// TA BORT:
const [aboutOpen, setAboutOpen] = useState(false);
```

**3. Ta bort hela "About Byggio" kortet (rad 71-104):**
```tsx
// TA BORT HELA DENNA SEKTION:
{/* About Byggio */}
<Card className="w-full border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
  <Collapsible open={aboutOpen} onOpenChange={setAboutOpen}>
    ...
  </Collapsible>
</Card>
```

---

### Resultat

Inloggningssidan kommer endast visa:
1. Login-kortet (med logo, formulär, registrera-länk och guide-länk)
2. Kontaktinformation längst ner

Den kollapsibla "Vilka är Byggio?"-sektionen tas bort helt.
