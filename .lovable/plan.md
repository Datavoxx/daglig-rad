

# Plan: Fixa kundnavigering från Global Assistant

## Problem

| Nuvarande beteende | Förväntat beteende |
|-------------------|-------------------|
| Klick på kund → går till `/customers?id=xxx` → visar listan, inte kunden | Klick på kund → visar kundens detaljer direkt |
| `search_customers` returnerar `type: "verification"` → kräver extra klick | Ska visa kundlista med direktlänkar |

## Rotorsak

1. **Edge Function**: `search_customers` returnerar `type: "verification"` istället för `type: "list"` (som `search_projects` gör)
2. **Kundsidan**: Hanterar inte `?id=xxx` URL-parametern för att automatiskt öppna kundens detaljsheet

## Lösning

### Del 1: Ändra `search_customers` till `type: "list"` (liksom `search_projects`)

Uppdatera edge-funktionen så att kundsökningar returnerar en lista med direktlänkar istället för verifikationskort.

### Del 2: Lägg till URL-parameterhantering i `Customers.tsx`

Precis som offert-sidan nu hanterar `?id=xxx`, ska kundsidan:
1. Läsa `id`-parametern från URL:en
2. Hämta kunden med det ID:t
3. Automatiskt öppna detaljsheeten

## Teknisk implementation

### Fil 1: `supabase/functions/global-assistant/index.ts`

Ändra `formatToolResults` för `search_customers` (rad 1066-1091):

```typescript
// FÖRE:
case "search_customers": {
  const customers = results as Array<{...}>;
  
  return {
    type: "verification",  // <-- Problemet
    content: `Jag hittade ${customers.length} matchande kund...`,
    data: {
      entityType: "customer",
      matches: customers.map((c) => ({...})),
    },
  };
}

// EFTER:
case "search_customers": {
  const customers = results as Array<{
    id: string;
    name: string;
    city: string;
    email?: string;
    phone?: string;
    customer_type?: string;
  }>;
  
  return {
    type: "list",
    content: customers.length > 0 
      ? `Här är ${customers.length} kund${customers.length > 1 ? "er" : ""}:`
      : "Inga kunder hittades.",
    data: {
      listType: "customer",
      listItems: customers.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.city || "Ingen stad angiven",
        status: c.customer_type === "business" ? "Företag" : "Privat",
        statusColor: c.customer_type === "business" ? "blue" : "green",
        details: [
          ...(c.email ? [{ label: "E-post", value: c.email }] : []),
          ...(c.phone ? [{ label: "Telefon", value: c.phone }] : []),
        ],
        link: `/customers?id=${c.id}`,
      })),
    },
  };
}
```

### Fil 2: `src/pages/Customers.tsx`

Lägg till URL-parameterhantering (liknande Estimates-sidan):

```typescript
import { useSearchParams } from "react-router-dom";

// Inuti komponenten:
const [searchParams, setSearchParams] = useSearchParams();

// I useEffect efter fetchCustomers:
useEffect(() => {
  const customerId = searchParams.get("id");
  if (customerId && customers.length > 0) {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setDetailSheetOpen(true);
      // Rensa URL-parametern
      setSearchParams({}, { replace: true });
    }
  }
}, [customers, searchParams, setSearchParams]);
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Ändra `search_customers` från `verification` till `list` med länk |
| `src/pages/Customers.tsx` | Lägg till hantering av `?id=xxx` URL-parameter |

## Resultat

| Före | Efter |
|------|-------|
| Klick → `/customers?id=xxx` → visar lista | Klick → `/customers?id=xxx` → öppnar kundens sheet |
| Kräver extra "Visa information om X" meddelande | Direktlänk öppnar kunden |
| Kundlista visas som verifikationskort | Kundlista visas som snygga listkort med länkikoner |

