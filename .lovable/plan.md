

## Plan: Guide-sektion med lead capture-formulär på Landing Page

### Översikt
Skapa en ny sektion på landing page där besökare kan ladda ner Byggio-guiden som PDF. För att få tillgång till nedladdningen måste de fylla i namn och e-postadress. Denna data sparas i en ny databastabell för framtida marknadsföring.

---

### DEL 1: Ny databastabell för leads

**Skapar tabellen `guide_leads`:**

```sql
CREATE TABLE public.guide_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  downloaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS för att tillåta inserts utan autentisering (publika besökare)
ALTER TABLE public.guide_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit lead"
  ON public.guide_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Endast backend/admin kan läsa leads (ingen SELECT-policy för anon)
```

---

### DEL 2: Ny komponent - GuideSection

**Ny fil: `src/components/landing/GuideSection.tsx`**

**Design:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│           📖  DIN GRATIS GUIDE                                      │
│                                                                     │
│   "Komplett guide till effektiv projekthantering"                   │
│                                                                     │
│   Lär dig hur du:                                                   │
│   • Sparar tid på dokumentation                                     │
│   • Skapar professionella offerter                                  │
│   • Hanterar projekt från start till slut                          │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────┐       │
│   │  [PDF-förhandsvisning med 3D-effekt]                    │       │
│   │                                                         │       │
│   │   BYGGIO GUIDE                                          │       │
│   │   Din kompletta guide till...                           │       │
│   │                                                         │       │
│   └─────────────────────────────────────────────────────────┘       │
│                                                                     │
│   ┌────────────────────────────┐  ┌──────────────────────────────┐  │
│   │ Ditt namn                  │  │ Din e-postadress             │  │
│   └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                     │
│               [  Ladda ner gratis  📥  ]                            │
│                                                                     │
│   Genom att ladda ner godkänner du vår integritetspolicy            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Funktionalitet:**
1. Två input-fält: Namn och E-post (med validering)
2. Submit-knapp som:
   - Sparar namn + email till `guide_leads` tabellen via Supabase
   - Genererar och laddar ner PDF:en med `generateGuidePdf()`
   - Visar success-toast
3. Länk till integritetspolicy
4. Visuell 3D-förhandsvisning av PDF:en

---

### DEL 3: Anpassa PDF-generering för landing page

**Fil: `src/lib/generateGuidePdf.ts`**

Funktionen fungerar redan utan company settings, men vi säkerställer att den fungerar korrekt för publika besökare (utan logga).

---

### DEL 4: Uppdatera Landing.tsx

**Fil: `src/pages/Landing.tsx`**

Lägg till `<GuideSection />` mellan `TimeComparisonSection` och `CTASection`:

```tsx
import GuideSection from "@/components/landing/GuideSection";

// ...

<main>
  <HeroSection />
  <FeaturesSection />
  <IntegrationsSection />
  <HowItWorksSection />
  <TimeComparisonSection />
  <GuideSection />    {/* NY */}
  <CTASection />
</main>
```

---

### DEL 5: Formulär-komponenten i detalj

**Innehåll i GuideSection.tsx:**

```tsx
// State
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

// Validering
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Submit-funktion
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  if (!name.trim() || !isValidEmail(email)) {
    toast.error("Fyll i alla fält korrekt");
    return;
  }
  
  setIsSubmitting(true);
  
  // Spara lead till databasen
  const { error } = await supabase
    .from("guide_leads")
    .insert({ name: name.trim(), email: email.trim().toLowerCase() });
  
  if (error) {
    toast.error("Något gick fel, försök igen");
    setIsSubmitting(false);
    return;
  }
  
  // Generera och ladda ner PDF
  await generateGuidePdf();
  
  toast.success("Guiden laddas ner!");
  setIsSubmitting(false);
  
  // Rensa formuläret
  setName("");
  setEmail("");
};
```

---

### Teknisk detaljplan

| Fil | Åtgärd |
|-----|--------|
| **Migration** | Skapa `guide_leads` tabell med RLS |
| `GuideSection.tsx` | **NY** - Sektion med formulär och PDF-förhandsvisning |
| `Landing.tsx` | Importera och lägg till `<GuideSection />` |
| `generateGuidePdf.ts` | Ingen ändring (fungerar redan för publika) |

---

### Visuella detaljer

**PDF-förhandsvisning:**
- Mockup av PDF:en med 3D-tilt-effekt (liknande TiltCard)
- Visar rubrik "BYGGIO GUIDE" och undertitel
- Subtil skugga och rotation vid hover

**Formulär:**
- Responsiv layout: sida vid sida på desktop, staplade på mobil
- Input-fält med samma styling som resten av appen
- Primary-färgad CTA-knapp med ikon
- Loading-state under submission

**Sektion:**
- Bakgrund: Gradient som matchar övriga sektioner
- Centrerad innehåll med max-width
- Badge högst upp: "Gratis resurs"

