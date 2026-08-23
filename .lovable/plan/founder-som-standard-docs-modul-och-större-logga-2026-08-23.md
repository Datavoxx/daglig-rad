# Founder som standard, Docs-modul och större logga

## Vad som gäller idag (verifierat)
- Nya konton får rollen `admin` och modulerna `dashboard` + `estimates` via databastriggern `handle_new_user`.
- I databasen finns idag 9 konton med rollen `admin`, 2 med `user`, och `mahad@datavoxx.se` har både `admin` och `founder`.
- Tabellen `documents` finns redan i databasen (titel, innehåll, koppling till projekt/kund), men **all Docs-kod saknas i appen** — ingen sida, ingen editor, ingen sidomenypost.
- Sidomenyn (`AppLayout`) och behörighetshooken har ingen `docs`-nyckel.
- Loggan: sidomenyn använder en liten container, mobilheadern `h-8`, landningssidans navbar `h-8 / md:h-10`.

Notering: du sa "mahad@datavox.se" — kontot som faktiskt finns heter **mahad@datavoxx.se** (dubbel x). Planen använder det. Säg till om det ska vara annorlunda.

## 1. Roller
- Alla nya konton skapas som **founder** (uppdatera `handle_new_user`).
- Endast **mahad@datavoxx.se** ska vara `admin`. Befintliga admin-rader på alla andra konton konverteras till `founder`.
- Rollerna `user` (anställda) rörs inte.

## 2. Standardmoduler för nya konton
Nya konton får exakt: `dashboard`, `estimates`, `docs`.
Befintliga konton behåller sina nuvarande moduler (ändras manuellt vid behov).

## 3. Docs-modul (Google Docs-liknande)
- Ny sida `/docs`: lista över dokument (titel, senast ändrad, sök, "Nytt dokument", ta bort).
- Ny sida `/docs/:id`: rich text-editor (TipTap) med rubriker, fet/kursiv, listor, checklistor, länkar, citat — autosparar medan man skriver, titel redigeras direkt i toppen.
- Dokument kan valfritt kopplas till projekt eller kund.
- Ny sidomenypost "Docs" bakom modulnyckeln `docs`, både i desktopmenyn och i mobilmenyn.
- Behörighetshooken utökas med `docs` och rutten skyddas som övriga moduler.

## 4. Dashboard speglar behörigheter
Dashboarden visar bara innehåll för moduler man har åtkomst till. Med standarduppsättningen (dashboard + offert + docs) betyder det:
- Offert-relaterat: antal/summa offerter, senaste offerter, snabbknapp "Ny offert".
- Docs-relaterat: senaste dokument + snabbknapp "Nytt dokument".
- Allt annat (personalliggare, tid, projekt, fakturor, löneexport, statistik-widgets kopplade till dessa) döljs helt när modulen saknas — inga tomma sektioner.

## 5. Större logga
- Sidomeny (inloggat läge): loggan förstoras märkbart i både utfälld och mobil header.
- Landningssidans navbar: loggan förstoras (och navbar-höjden justeras så den inte klipps).

## Tekniska detaljer
- Migration: uppdatera `handle_new_user` (roll `founder`, moduler `dashboard/estimates/docs`), samt engångsuppdatering av befintliga `user_roles`-rader.
- `documents` behåller befintlig RLS; endast läs/skriv för eget konto enligt nuvarande policyer.
- Nya filer: `src/pages/Docs.tsx`, `src/pages/DocView.tsx`, editor-komponenter under `src/components/docs/`.
- Beroenden: TipTap (`@tiptap/react`, `@tiptap/starter-kit`, plus länk/task-list/placeholder-tillägg) samt editorstilar i `src/index.css`.
- Ändras: `src/hooks/useUserPermissions.ts`, `src/components/layout/AppLayout.tsx`, `src/components/auth/ProtectedModuleRoute.tsx`, `src/App.tsx`, `src/pages/Dashboard.tsx`, `src/components/landing/LandingNavbar.tsx`.
