# Byt Personalliggare mot Offerter för anställda

Anställda (roll `user`) ska inte längre se personalliggaren. Istället får de Offerter — på dashboarden, i sidomenyn och i bottennavigeringen på mobil.

## Ändringar

**1. Behörigheter**
- `src/hooks/useUserPermissions.ts`: anställdas modullista blir `["estimates", "time-reporting", "daily-reports"]` (attendance tas bort, estimates läggs till).

**2. Anställd-dashboard (`src/pages/EmployeeDashboard.tsx`)**
- Kortet "Personalliggare" ersätts med "Offerter" (kalkylator-ikon, länk till `/estimates`).
- Kortet visar antal offerter användaren kan se, med texten "offerter". Frågan mot in/utcheckning tas bort.

**3. Sidomeny (`src/components/layout/AppLayout.tsx`)**
- I anställdas navigering byts "Personalliggare" mot "Offerter" (`/estimates`).

**4. Bottennav mobil (`src/components/layout/BottomNav.tsx`)**
- Anställdas nav blir: Hem, Dagbok, Tid, Offert.

## Viktigt att veta om data

Offerter är idag låsta per konto i databasen (`user_id = auth.uid()`). En anställd som öppnar Offerter kommer alltså se en **tom lista** — arbetsgivarens offerter syns inte. Om anställda ska kunna se arbetsgivarens offerter behövs en regeländring i databasen (samma mönster som används för tid/närvaro via `get_employer_id`).

Säg till om du vill att jag inkluderar det: antingen **läsbehörighet** (anställda ser arbetsgivarens offerter men kan inte ändra) eller **full behörighet** (kan även skapa/redigera). Annars byggs bara UI- och menyändringarna ovan, och anställda ser enbart eventuella egna offerter.
