

## Plan: Visa riktigt namn istället för "Anonym" på dashboarden

### Problem

Dashboarden visar "Anonym" för personal på plats, men Attendance-sidan visar rätt namn ("omar abdullahi").

**Orsak:** Dashboarden läser bara `guest_name` från `attendance_records`, men detta fält är `null` när en inloggad användare checkar in. Attendance-sidan hämtar däremot namnet från `profiles`-tabellen via `user_id`.

### Lösning

Uppdatera Dashboard så att den, precis som ActiveWorkers-komponenten, hämtar användarnamn från `profiles`-tabellen.

---

### Teknisk implementation

**Fil: `src/pages/Dashboard.tsx`**

1. **Utöka AttendanceRecord interface:**
```typescript
interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  guest_name: string | null;
  project_id: string;
  projects?: { name: string } | null;
  // NYA FÄLT:
  profile_name?: string | null;
  profile_email?: string | null;
}
```

2. **Hämta profildata efter attendance-query:**
```typescript
// Efter att ha hämtat activeWorkersRes...
const userIds = activeWorkersRes.data?.map(r => r.user_id) || [];
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, full_name, email")
  .in("id", userIds);

const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

// Mappa ihop med profildata
const enrichedWorkers = activeWorkersRes.data?.map(worker => ({
  ...worker,
  profile_name: profileMap.get(worker.user_id)?.full_name || null,
  profile_email: profileMap.get(worker.user_id)?.email || null,
}));
```

3. **Uppdatera display-logik:**
```typescript
// I render:
const displayName = worker.guest_name 
  || worker.profile_name 
  || worker.profile_email?.split("@")[0] 
  || "Okänd";

const initials = displayName.split(" ")
  .map(n => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);
```

---

### Resultat

| Före | Efter |
|------|-------|
| "Anonym" | "omar abdullahi" |
| "??" som avatar | "OA" som avatar |

Dashboarden kommer nu visa samma namn som Attendance-sidan genom att:
1. Först försöka använda `guest_name` (för gäster utan konto)
2. Fallback till `full_name` från profilen
3. Fallback till email-prefix
4. Sista fallback: "Okänd"

