
# Plan: Fixa projektlistning utan sökord

## Problem

`search_projects` kräver alltid en `query`-parameter, men användare vill ofta lista **alla** projekt med en viss status (t.ex. "Visa mina aktiva projekt") utan att söka på ett specifikt namn.

| Användarens begäran | Vad AI:n gör nu | Resultat |
|---------------------|-----------------|----------|
| "Visa mina aktiva projekt" | `query: "aktiva", status: "active"` | 0 träffar (söker på "aktiva" i projektnamn) |

## Lösning

Gör `query` valfri och lägg bara till `.or()`-filtret om `query` faktiskt finns.

## Teknisk implementation

### 1. Uppdatera tool-definitionen (rad 36-42)

```typescript
// FÖRE:
{
  name: "search_projects",
  description: "Search for projects by name or client",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      status: { type: "string", description: "Filter by status (active, completed, etc.)" },
    },
    required: ["query"],  // <-- Problemet
  },
}

// EFTER:
{
  name: "search_projects",
  description: "Search for projects by name, client, or status. Use status alone to list all projects with that status.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (optional - omit to list all)" },
      status: { type: "string", description: "Filter by status: planning, active, closing, completed" },
    },
    required: [],  // Ingen required - kan lista alla
  },
}
```

### 2. Uppdatera executeTool (rad 458-476)

```typescript
// FÖRE:
case "search_projects": {
  const query = args.query as string;
  const status = args.status as string | undefined;
  
  let q = supabase
    .from("projects")
    .select("id, name, client_name, address, city, status")
    .eq("user_id", userId)
    .or(`name.ilike.%${query}%,client_name.ilike.%${query}%`)  // <-- Körs alltid
    .limit(5);
  
  if (status) q = q.eq("status", status);
  
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// EFTER:
case "search_projects": {
  const query = args.query as string | undefined;
  const status = args.status as string | undefined;
  
  let q = supabase
    .from("projects")
    .select("id, name, client_name, address, city, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  
  // Only add search filter if query is provided
  if (query && query.trim()) {
    q = q.or(`name.ilike.%${query}%,client_name.ilike.%${query}%`);
  }
  
  if (status) {
    q = q.eq("status", status);
  }
  
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
```

## Fil att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Gör `query` valfri i definition + logik |

## Resultat efter fix

| Användarens begäran | Vad AI:n gör | Resultat |
|---------------------|--------------|----------|
| "Visa mina aktiva projekt" | `status: "active"` | Listar alla med status active |
| "Visa projekt tony" | `query: "tony"` | Söker på "tony" i namn/kund |
| "Visa mina projekt" | (inga params) | Listar de 10 senaste projekten |
| "Visa pågående projekt för Adam" | `query: "Adam", status: "active"` | Kombinerad sökning |
