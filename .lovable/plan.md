
# Plan: Fixa "hämta/visa" vs "uppdatera" i Global Assistant

## Problem

Global Assistant saknar verktyg för att endast **läsa** data. När användaren ber om att "hämta" eller "visa" en offert/projekt/kund, tvingas AI:n använda `update_`-verktyg utan parametrar, vilket resulterar i felaktigt meddelande "har uppdaterats!".

## Lösning

Lägg till dedikerade read-only verktyg för att hämta fullständig information om entiteter.

## Nya verktyg att lägga till

| Verktyg | Beskrivning |
|---------|-------------|
| `get_estimate` | Hämta fullständig offert med rader, summor, status |
| `get_project` | Hämta projektdetaljer med ekonomi, faser, status |
| `get_customer` | Hämta kundinfo med kontaktuppgifter, projekt, offerter |

## Teknisk implementation

### 1. Lägg till verktyg i tool registry

```typescript
{
  type: "function",
  function: {
    name: "get_estimate",
    description: "Hämta och visa fullständig information om en offert",
    parameters: {
      type: "object",
      properties: {
        estimate_id: { type: "string", description: "Offertens ID" }
      },
      required: ["estimate_id"]
    }
  }
}

{
  type: "function", 
  function: {
    name: "get_project",
    description: "Hämta och visa fullständig information om ett projekt",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Projektets ID" }
      },
      required: ["project_id"]
    }
  }
}

{
  type: "function",
  function: {
    name: "get_customer", 
    description: "Hämta och visa fullständig information om en kund",
    parameters: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "Kundens ID" }
      },
      required: ["customer_id"]
    }
  }
}
```

### 2. Implementera executeTool för nya verktyg

```typescript
case "get_estimate": {
  const { estimate_id } = args;
  
  // Hämta offert med alla rader
  const { data: estimate, error } = await supabase
    .from("project_estimates")
    .select(`
      *,
      customers (name, email, phone),
      projects (name, status)
    `)
    .eq("id", estimate_id)
    .eq("user_id", userId)
    .single();
    
  if (error) throw error;
  
  // Hämta rader
  const { data: items } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("estimate_id", estimate_id)
    .order("order_index");
    
  return { ...estimate, items: items || [] };
}

case "get_project": {
  const { project_id } = args;
  
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      customers (name, email, phone)
    `)
    .eq("id", project_id)
    .eq("user_id", userId)
    .single();
    
  if (error) throw error;
  return project;
}

case "get_customer": {
  const { customer_id } = args;
  
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customer_id)
    .eq("user_id", userId)
    .single();
    
  if (error) throw error;
  
  // Hämta relaterade projekt och offerter
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("customer_id", customer_id)
    .limit(5);
    
  const { data: estimates } = await supabase
    .from("project_estimates")
    .select("id, offer_number, status, manual_project_name")
    .eq("customer_id", customer_id)
    .limit(5);
    
  return { ...customer, projects: projects || [], estimates: estimates || [] };
}
```

### 3. Formatera resultat med detaljerad info

```typescript
case "get_estimate": {
  const estimate = results as any;
  const totalRows = estimate.items?.length || 0;
  
  // Beräkna summor från items
  const laborTotal = estimate.items?.reduce((sum, item) => 
    item.row_type === 'labor' ? sum + (item.subtotal || 0) : sum, 0) || 0;
  const materialTotal = estimate.items?.reduce((sum, item) => 
    item.row_type === 'material' ? sum + (item.subtotal || 0) : sum, 0) || 0;
  
  return {
    type: "result",
    content: `**${estimate.offer_number || 'Offert'}**

**Projekt:** ${estimate.manual_project_name || estimate.projects?.name || 'Ej angivet'}
**Kund:** ${estimate.customers?.name || 'Ej angiven'}
**Status:** ${estimate.status || 'Utkast'}

**Summering:**
- Arbete: ${laborTotal.toLocaleString('sv-SE')} kr
- Material: ${materialTotal.toLocaleString('sv-SE')} kr
- Antal rader: ${totalRows}

**Skapad:** ${new Date(estimate.created_at).toLocaleDateString('sv-SE')}`,
    data: {
      success: true,
      resultMessage: "",
      link: {
        label: "Öppna offert",
        href: `/estimates?id=${estimate.id}`
      },
      nextActions: [
        { label: "Redigera offert", icon: "edit", prompt: "Redigera denna offert" },
        { label: "Skapa projekt", icon: "folder", prompt: "Skapa projekt från denna offert" },
        { label: "Visa kund", icon: "user", prompt: "Visa kunden för denna offert" }
      ]
    }
  };
}

case "get_project": {
  const project = results as any;
  
  return {
    type: "result",
    content: `**${project.name}**

**Kund:** ${project.customers?.name || 'Ej angiven'}
**Status:** ${project.status || 'Ej angiven'}
**Adress:** ${project.address || 'Ej angiven'}

**Ekonomi:**
- Budget: ${(project.budget || 0).toLocaleString('sv-SE')} kr
- Fakturerat: ${(project.invoiced_amount || 0).toLocaleString('sv-SE')} kr

**Skapad:** ${new Date(project.created_at).toLocaleDateString('sv-SE')}`,
    data: {
      success: true,
      resultMessage: "",
      link: {
        label: "Öppna projekt",
        href: `/projects/${project.id}`
      },
      nextActions: [
        { label: "Skapa dagrapport", icon: "clipboard", prompt: "Skapa dagrapport för detta projekt" },
        { label: "Registrera tid", icon: "clock", prompt: "Registrera tid på detta projekt" },
        { label: "Visa planering", icon: "calendar", prompt: "Visa planeringen för detta projekt" }
      ]
    }
  };
}

case "get_customer": {
  const customer = results as any;
  
  return {
    type: "result",
    content: `**${customer.name}**

**Kontakt:**
- Email: ${customer.email || 'Ej angiven'}
- Telefon: ${customer.phone || 'Ej angiven'}
- Adress: ${customer.address || 'Ej angiven'}${customer.city ? `, ${customer.city}` : ''}

**Relaterat:**
- Projekt: ${customer.projects?.length || 0} st
- Offerter: ${customer.estimates?.length || 0} st`,
    data: {
      success: true,
      resultMessage: "",
      link: {
        label: "Öppna kund",
        href: `/customers?id=${customer.id}`
      },
      nextActions: [
        { label: "Skapa offert", icon: "file-text", prompt: "Skapa offert för denna kund" },
        { label: "Skapa projekt", icon: "folder", prompt: "Skapa projekt för denna kund" },
        { label: "Redigera kund", icon: "edit", prompt: "Redigera denna kund" }
      ]
    }
  };
}
```

### 4. Uppdatera systemprompt

Förtydliga för AI:n när den ska använda `get_` vs `update_`:

```typescript
// Lägg till i systemPrompt:
VIKTIGT - SKILLNAD MELLAN HÄMTA OCH UPPDATERA:
- När användaren vill "visa", "hämta", "se" eller "öppna" → använd get_estimate/get_project/get_customer
- När användaren vill "ändra", "uppdatera", "redigera" med specifika värden → använd update_*
- ALDRIG använd update_* utan faktiska ändringar att göra
```

## Filer att modifiera

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lägg till 3 nya get-verktyg + formatering |

## Resultat

Efter implementationen:

| Användarens begäran | Före (fel) | Efter (rätt) |
|---------------------|------------|--------------|
| "Hämta offert X" | "Offerten har uppdaterats!" | Visar offertens detaljer med summor och länk |
| "Visa projekt Y" | Funkade inte | Visar projektinfo med ekonomi och status |
| "Visa kund Z" | Funkade inte | Visar kundinfo med relaterade projekt/offerter |
