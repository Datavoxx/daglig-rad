

## Ta bort påslag på artikelpriser

### Vad ändras

Prislogiken i `src/components/projects/ServiceWorkOrderView.tsx` förenklas. Istället för att räkna ut kundpris med påslag (`default_price * (1 + markup/100)`) används `default_price` rakt av om inget `customer_price` är satt.

### Teknisk ändring

**Fil: `src/components/projects/ServiceWorkOrderView.tsx`**

Funktionen `getCustomerPrice` (rad 133-137) ändras från:

```text
customer_price ?? (default_price * (1 + markup/100))
```

till:

```text
customer_price ?? default_price
```

Dessutom:
- Ta bort state-variabeln `markupPercent` (rad 89) -- den används inte längre
- Ta bort hämtningen av `material_markup_percent` från `user_pricing_settings` (rad 124, 129)
- Snabbval-chips visar nu samma pris som i artikelbiblioteket (om inget kundpris är satt)

### Påverkan
- Artiklar utan `customer_price` får sitt `default_price` som pris på arbetsordern
- Artiklar med `customer_price` påverkas inte -- det priset används fortfarande
- Ingen databasändring behövs

