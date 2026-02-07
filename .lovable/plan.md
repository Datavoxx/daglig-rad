

## Mål

Fixa `get_time_summary` i Byggio AI så att administratörer ser samtliga tidsregistreringar (sina egna + anställdas), precis som i kalendervyn.

---

## Orsaksanalys

| Komponent | Hämtar data | Resultat |
|-----------|-------------|----------|
| TimeCalendarView | Alla poster via RLS (inget `user_id`-filter) | 7 timmar ✅ |
| Byggio AI `get_time_summary` | `.eq("user_id", userId)` | 0 timmar ❌ |

Problemet: Edge-funktionen har ett **hårdkodat filter** på `user_id` som kalendervyn **inte** har.

---

## Lösning

Uppdatera `get_time_summary` för att inkludera anställdas tidsregistreringar om användaren är admin/ägare.

### Logik

1. Kolla om användaren har `employer_id` (= anställd) eller inte (= admin)
2. **Om admin**: Hämta poster där `user_id = userId` ELLER `employer_id = userId`
3. **Om anställd**: Behåll nuvarande beteende (endast egna poster)

---

## Teknisk implementation

### Ändra i `supabase/functions/global-assistant/index.ts`

**Nuvarande kod (rad 2070-2080):**
```typescript
case "get_time_summary": {
  const { start_date, end_date, project_id } = args as {...};
  
  let q = supabase
    .from("time_entries")
    .select("id, date, hours, description, project_id, projects(name)")
    .eq("user_id", userId)  // ← Problemet
    .gte("date", start_date)
    .lte("date", end_date)
    .order("date", { ascending: false });
```

**Uppdaterad kod:**
```typescript
case "get_time_summary": {
  const { start_date, end_date, project_id } = args as {...};
  
  // Kolla om användaren är admin (ingen employer_id) eller anställd
  const { data: userData } = await supabase.auth.getUser();
  const employerId = userData?.user?.user_metadata?.employer_id;
  const isAdmin = !employerId;
  
  let q = supabase
    .from("time_entries")
    .select("id, date, hours, description, project_id, user_id, projects(name)")
    .gte("date", start_date)
    .lte("date", end_date)
    .order("date", { ascending: false });
  
  if (isAdmin) {
    // Admin: hämta egna poster + anställdas poster (där employer_id = admin)
    q = q.or(`user_id.eq.${userId},employer_id.eq.${userId}`);
  } else {
    // Anställd: endast egna poster
    q = q.eq("user_id", userId);
  }
  
  if (project_id) q = q.eq("project_id", project_id);
  
  const { data, error } = await q;
  // ...
}
```

---

## Sammanfattning

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `supabase/functions/global-assistant/index.ts` | Uppdatera `get_time_summary` för att inkludera `employer_id`-logik |

---

## Resultat

- **Admin** frågar "hur ser tidsrapporteringen ut denna vecka?" → ser 7 timmar (inkl. anställdas tid)
- **Anställd** frågar samma fråga → ser endast sina egna timmar
- Konsekvent beteende mellan Byggio AI och kalendervyn

