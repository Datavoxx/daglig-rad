

## Lägg till branschval vid registrering

### Vad ändras
Vid registrering visas ett nytt fält "Bransch" med fyra alternativ: **Målare**, **VVS**, **Elektriker**, **Bygg**. Användaren måste välja ett innan de kan registrera sig. Valet sparas i databasen för analys av vilken målgrupp som registrerar sig mest.

### Steg

1. **Databasmigrering** -- Lägg till kolumn `industry` (text, nullable) i tabellen `profiles`.

2. **`src/pages/Register.tsx`**
   - Lägg till state `industry` och en `Select`-komponent med de fyra alternativen
   - Validering: kräv att en bransch väljs innan registrering
   - Skicka `industry` som user_metadata vid signup
   - Uppdatera `profiles`-tabellen efter registrering med vald bransch

3. **`handle_new_user`-triggerfunktionen** -- Uppdatera den befintliga triggern så att `industry` sparas från `raw_user_meta_data` till `profiles`.

4. **`notify-new-account`** -- Skicka med `industry` i webhook-anropet så att ni kan se bransch i notifieringen.

### Tekniska detaljer

**SQL-migrering:**
```sql
ALTER TABLE public.profiles ADD COLUMN industry text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, industry)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'industry'
    );
    -- ... resten av rollsättning oförändrad
END;
$$;
```

**Register.tsx -- ny state + UI:**
```tsx
const [industry, setIndustry] = useState<string>("");

// Validering: kräv branschval
if (!industry) {
  setValidationError("Välj en bransch");
  return false;
}

// Skicka med i signup metadata:
data: {
  full_name: fullName,
  industry: industry,
}

// UI (Select-komponent före lösenord):
<Select value={industry} onValueChange={setIndustry}>
  <SelectItem value="malare">Målare</SelectItem>
  <SelectItem value="vvs">VVS</SelectItem>
  <SelectItem value="elektriker">Elektriker</SelectItem>
  <SelectItem value="bygg">Bygg</SelectItem>
</Select>
```

**notify-new-account -- utöka body:**
```tsx
body: { email, full_name: fullName, user_id: data.user.id, industry }
```

Fyra ändringar: en migrering, Register.tsx, triggerfunktion, notify-webhook.
