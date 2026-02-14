

## Koppla Google Places Autocomplete till AI-assistentens formulär

### Vad vi gör
Byter ut vanliga `Input`-fält för adress i två formulär i den globala assistenten mot `AddressAutocomplete`-komponenten som redan finns i projektet. Den kopplar automatiskt till Google Places API med autocomplete för svenska adresser.

### Berörda filer

**1. `src/components/global-assistant/EstimateFormCard.tsx`**
- Byt ut `Input` för adressfältet (rad 144-150) mot `AddressAutocomplete`
- Importera `AddressAutocomplete` och `AddressData` från `@/components/shared/AddressAutocomplete`
- När användaren väljer en adress från autocomplete fylls adressen i automatiskt

**2. `src/components/global-assistant/CustomerFormCard.tsx`**
- Byt ut `Input` för adressfältet (rad 133-139) mot `AddressAutocomplete`
- Importera `AddressAutocomplete` och `AddressData`
- Koppla `onStructuredChange` så att stad-fältet fylls i automatiskt från Google (postnummer och city extraheras)
- När en adress väljs: sätt `address` till gatuadressen och `city` till staden automatiskt

### Hur det fungerar
Projektet har redan en färdig `AddressAutocomplete`-komponent (`src/components/shared/AddressAutocomplete.tsx`) som:
- Laddar Google Maps JS API med Places-biblioteket
- Visar autocomplete-förslag begränsade till Sverige
- Extraherar postnummer, stad, lat/lng från det valda resultatet

Ingen ny API-nyckel eller backend-ändring behövs -- samma Google API-nyckel som redan används i projektet återanvänds.

### Resultat
Båda formulären i AI-assistenten får adress-autocomplete med Google Places, precis som det redan fungerar i kunddialogen och offertguiden.
