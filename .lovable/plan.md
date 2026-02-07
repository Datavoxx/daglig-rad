
## Mål

Ändra projektskapande via Byggio AI så att det fungerar som på Projekt-sidan: man måste välja en befintlig offert istället för att skriva in projektnamn manuellt.

---

## Nuvarande beteende

| Komponent | Hur det fungerar nu |
|-----------|---------------------|
| `ProjectFormCard.tsx` | Manuell inmatning: projektnamn, kund (valfritt), adress (valfritt) |
| `get_project_form` (backend) | Hämtar endast kunder för dropdown |
| `create_project` (backend) | Skapar projekt med manuellt namn, valfri kund |

---

## Önskat beteende

Precis som på `/projects`:
1. Visa dropdown med tillgängliga offerter (ej redan kopplade till projekt)
2. Förhandsvisning av offertens data (projektnamn, kund, adress)
3. Vid skapande: kopiera all data från offerten + länka med `estimate_id`

---

## Ändringar

### 1. Backend: Uppdatera `get_project_form` tool

**Nuvarande:**
```typescript
case "get_project_form": {
  // Hämtar endast kunder
  const { data } = await supabase.from("customers").select("id, name")...
  return { customers: data || [] };
}
```

**Nytt:**
```typescript
case "get_project_form": {
  // Hämta offerter som INTE redan är kopplade till projekt
  const { data: projects } = await supabase
    .from("projects")
    .select("estimate_id")
    .eq("user_id", userId);
  
  const linkedEstimateIds = (projects || [])
    .map(p => p.estimate_id)
    .filter(Boolean);
  
  let query = supabase
    .from("project_estimates")
    .select("id, offer_number, manual_project_name, manual_client_name, manual_address, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (linkedEstimateIds.length > 0) {
    query = query.not("id", "in", `(${linkedEstimateIds.join(",")})`);
  }
  
  const { data: estimates } = await query;
  return { estimates: estimates || [] };
}
```

### 2. Backend: Uppdatera `create_project` tool

Ändra tool-definitionen och implementationen:

**Tool definition:**
```typescript
{
  name: "create_project",
  description: "Create a new project from an existing estimate. The project inherits all data from the estimate.",
  parameters: {
    type: "object",
    properties: {
      estimate_id: { type: "string", description: "Estimate ID to create project from" },
    },
    required: ["estimate_id"],
  },
}
```

**Implementation:**
```typescript
case "create_project": {
  const { estimate_id } = args as { estimate_id: string };
  
  // Hämta offertens data
  const { data: estimate, error: estError } = await supabase
    .from("project_estimates")
    .select("manual_project_name, manual_client_name, manual_address, manual_postal_code, manual_city, manual_latitude, manual_longitude, offer_number")
    .eq("id", estimate_id)
    .single();
  
  if (estError || !estimate) throw new Error("Offerten hittades inte");
  
  // Skapa projektet med offertens data
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: estimate.manual_project_name || estimate.offer_number || "Nytt projekt",
      client_name: estimate.manual_client_name || null,
      address: estimate.manual_address || null,
      postal_code: estimate.manual_postal_code || null,
      city: estimate.manual_city || null,
      latitude: estimate.manual_latitude || null,
      longitude: estimate.manual_longitude || null,
      estimate_id,
      status: "active",
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3. Frontend: Ny komponent `ProjectFormCard.tsx`

Ersätt nuvarande formulär med offertväljare:

```typescript
interface Estimate {
  id: string;
  offer_number: string | null;
  manual_project_name: string | null;
  manual_client_name: string | null;
  manual_address: string | null;
  status: string;
}

interface ProjectFormCardProps {
  estimates: Estimate[];
  onSubmit: (data: { estimateId: string }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

// Visar:
// 1. Dropdown med offerter (namn + offertnummer)
// 2. Förhandsvisning av vald offerts data
// 3. Knapp "Skapa projekt" (disabled om ingen offert vald)
// 4. Tom-state om inga offerter finns (med länk till /estimates)
```

### 4. Frontend: Uppdatera `MessageList.tsx`

Ändra props som skickas till `ProjectFormCard`:

```typescript
{message.type === "project_form" && message.data?.estimates && onProjectFormSubmit && (
  <ProjectFormCard
    estimates={message.data.estimates}
    onSubmit={onProjectFormSubmit}
    onCancel={onProjectFormCancel}
    disabled={isLoading}
  />
)}
```

### 5. Frontend: Uppdatera `GlobalAssistant.tsx`

Ändra submit-hanteraren:

```typescript
const handleProjectFormSubmit = async (formData: { estimateId: string }) => {
  await sendMessage(
    `Skapa projekt från offert med ID ${formData.estimateId}`,
    { selectedEstimateId: formData.estimateId }
  );
};
```

### 6. Backend: Uppdatera response formatter

```typescript
case "get_project_form": {
  const result = results as { estimates: Array<Estimate> };
  
  if (result.estimates.length === 0) {
    return {
      type: "text",
      content: "Du har inga tillgängliga offerter att skapa projekt från. Skapa en offert först, eller säg 'skapa offert'.",
    };
  }
  
  return {
    type: "project_form",
    content: "",
    data: {
      estimates: result.estimates,
    },
  };
}
```

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Tool definition, implementation, response formatter |
| `src/components/global-assistant/ProjectFormCard.tsx` | Ersätt med offertväljare |
| `src/components/global-assistant/MessageList.tsx` | Uppdatera props för ProjectFormCard |
| `src/pages/GlobalAssistant.tsx` | Uppdatera handleProjectFormSubmit |

---

## Resultat efter ändring

1. När användaren säger "skapa projekt" visas en dropdown med tillgängliga offerter
2. Förhandsvisning av vald offerts data (projektnamn, kund, adress)
3. Projektet skapas med alla fält från offerten + länk via `estimate_id`
4. Om inga offerter finns visas ett meddelande med förslag att skapa offert först
