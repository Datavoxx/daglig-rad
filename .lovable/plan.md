
## Plan: Lägg till "Tillbaka till startsidan"-knapp på Auth-sidan

### Översikt
Lägga till en knapp/länk högst upp på inloggningssidan som tar användaren tillbaka till landing page:n (startsidan).

---

### Ändring i `src/pages/Auth.tsx`

**1. Lägg till import för `ArrowLeft`-ikonen (rad 3):**
```tsx
import { Mail, Lock, Eye, EyeOff, BookOpen, Phone, ArrowLeft } from "lucide-react";
```

**2. Lägg till tillbaka-knappen ovanför login-kortet (efter rad 67):**

Placeras i början av innehålls-div:en, innan Login Card:

```tsx
{/* Tillbaka-knapp */}
<Link 
  to="/"
  className="self-start flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
>
  <ArrowLeft className="h-4 w-4" />
  <span>Tillbaka till startsidan</span>
</Link>
```

---

### Resultat

Inloggningssidan kommer visa:
1. **NY:** Tillbaka-länk i övre vänstra hörnet
2. Login-kortet (med logo, formulär, registrera-länk och guide-länk)
3. Kontaktinformation längst ner

Knappen leder till `/` (landing page).
