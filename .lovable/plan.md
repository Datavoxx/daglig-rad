
## Snabb materialhantering, pengar per jobb och mobil-speed

### Vad byggs

**1. Favoritmaterial (snabbknappar)**
Ovanfor materialformuläret visas en rad med klickbara knappar for användarens mest använda artiklar (hämtas fran `articles`-tabellen). Klick pa en favorit lägger direkt till materialet i arbetsordern med rätt namn, enhet och pris -- ett enda klick. Inga formulärfalt att fylla i.

Dessutom: artiklar i databasen har redan `default_price` -- detta blir inköpspris. Vi lägger till en kolumn `customer_price` (kundpris) pa `articles`-tabellen. Om kundpris saknas räknas det ut automatiskt via ett påslag (markup) fran användarens inställningar (`user_pricing_settings.material_markup_percent`, default 10%).

Prislogiken:
- Inköpspris = `default_price`
- Kundpris = `customer_price` ELLER `default_price * (1 + markup/100)`
- Nar favorit klickas sätts `unit_price` till kundpriset automatiskt

**2. Pengar per jobb (ekonomi-summary)**
Summerings-kortet i ServiceWorkOrderView uppgraderas. Istället for bara timmar och materialkostnad visas kronor:

- Tid: X h = Y kr (beräknat via timpris fran `user_pricing_settings.hourly_rate_general`)
- Material: Z kr
- **Totalt: Y + Z kr**

Stora, tydliga siffror. Gront = pengar. Triggear hjärnan.

**3. Mobil-speed (redesign av material + tid)**
- Favoritmaterial visas som horisontella chips -- ett klick = material tillagt
- Tid-formuläret förenklas: stort timmar-fält + "Lägg tid"-knapp pa samma rad
- Accordions startar öppna pa mobil (tid + material)
- Allt viktigt ovanfor folden

---

### Databasändringar

**1. Ny kolumn pa `articles`:**
```text
customer_price (numeric, nullable)
```
Om satt: används som kundpris. Om null: räknas ut via påslag.

Ingen annan migrering behövs -- `user_pricing_settings` har redan `material_markup_percent` och `hourly_rate_general`.

### Kodfiler som ändras

**1. `src/components/projects/ServiceWorkOrderView.tsx`**

Favoritmaterial:
- Hämta användarens artiklar fran `articles` (is_active = true), sorterat pa mest använda eller sort_order
- Visa som horisontella chips/knappar ovanfor materialformuläret (max 8-10 st)
- Klick pa chip: insert direkt i `work_order_materials` med artikelns namn, enhet och kundpris
- Ingen dialog, ingen bekräftelse -- direkt in

Ekonomi-summary:
- Hämta timpris fran `user_pricing_settings`
- Beräkna: tid i kronor = billableHours * hourlyRate
- Beräkna: total = tid_kr + billableMaterialCost
- Visa i summary-kortet med stora siffror och kr-suffix
- Byta fran 4 kort till 3 kort: "Tid (kr)", "Material (kr)", "Totalt (kr)"

Mobil-speed for tid:
- Förenkla tid-formuläret: timmar-input och "Lägg tid"-knapp pa samma rad
- Datum default = idag (redan sa)
- Billing type default = service (redan sa)
- Minimera antal synliga fält -- "Typ" och "Debiterbar" bakom en "Fler val"-expandering

**2. `src/components/projects/ServiceWorkOrderView.tsx` -- materialformuläret**
- Behall befintligt formulär for manuell inmatning (fri rad)
- Lägg favorit-chips ovanfor
- Nar chip klickas: hoppa over formuläret helt, insert direkt

**3. Databasmigrering**
- ALTER TABLE articles ADD COLUMN customer_price numeric;

### Prislogik (teknisk detalj)

```text
Nar favorit-chip klickas:
1. Hämta article.customer_price
2. Om null: hämta article.default_price och user_pricing_settings.material_markup_percent
3. kundpris = customer_price ?? (default_price * (1 + markup/100))
4. Insert i work_order_materials med unit_price = kundpris
```

### Visuell förändring i summary

Fran:
```text
[Total tid: 6h] [Debiterbar: 4h] [Material: 2100 kr] [Deb. mat: 1800 kr]
```

Till:
```text
[Tid: 4 200 kr] [Material: 1 800 kr] [TOTALT: 6 000 kr]
```

Tredje kortet ("Totalt") far en grön/accentfärg for att triggera "pengar-känslan".

### Sammanfattning av ändringar
- 1 databasmigrering (customer_price pa articles)
- 1 huvudfil ändras: `ServiceWorkOrderView.tsx` (favoriter, ekonomi, mobil-speed)
