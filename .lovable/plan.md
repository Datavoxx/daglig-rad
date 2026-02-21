
## Auto-ifyllning av projektdata vid nytt servicejobb

### Vad andras
Nar man trycker "Nytt jobb" i servicejobb-listan fylls formularet automatiskt med data fran projektet:
- **Jobbtitel** = projektnamn
- **Kundnamn** = projektets client_name
- **Adress** = projektets address
- **Telefon** = kundens telefonnummer (soks upp fran kundregistret baserat pa client_name)
- **Beskrivning** = offertens scope (projektbeskrivning fran offerten)

En toggle-knapp ("Hamta fran projekt") ar paslagan som standard. Om anvandaren stanger av den tomms alla falt och kan fyllas manuellt.

### Steg

1. **`ServiceWorkOrderList.tsx`**
   - Skicka projektdata (client_name, address, name) till create-dialogen som nya props
   - Hamta kundens telefonnummer fran `customers`-tabellen via client_name-matchning
   - Hamta offertens scope via projektets estimate_id

2. **`ServiceWorkOrderCreateDialog.tsx`**
   - Lagg till nya props: `defaultData` med projectName, clientName, clientPhone, address, description
   - Lagg till state `useProjectData` (boolean, default true)
   - Lagg till en Switch-komponent med label "Hamta fran projekt"
   - Nar switch ar PA: fyll i falt med defaultData
   - Nar switch stängs AV: tom alla falt
   - Nar switch slas PA igen: aterinfor defaultData
   - Anvandaren kan fortfarande redigera ifyllda falt

### Tekniska detaljer

**ServiceWorkOrderList.tsx:**
- Hamta kundtelefon: `supabase.from("customers").select("phone, mobile").ilike("name", clientName).limit(1)`
- Hamta offert-scope: `supabase.from("project_estimates").select("scope").eq("id", estimateId).maybeSingle()`
- Skicka data till dialogen via ny prop `defaultData`

**ServiceWorkOrderCreateDialog.tsx -- nya props:**
```text
interface DefaultData {
  projectName: string;
  clientName: string;
  clientPhone: string;
  address: string;
  description: string;
}

Props utökas med:
  defaultData?: DefaultData
```

**Toggle UI (ovanfor formularfalten):**
```text
Switch + Label: "Hamta fran projekt"
Nar togglad:
  PA  -> setForm({ title: defaultData.projectName, customer_name: ... })
  AV  -> setForm({ title: "", customer_name: "", ... })
```

Tva filer andras, ingen databasmigrering behovs.
