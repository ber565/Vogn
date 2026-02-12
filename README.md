# Vognlogg (Supabase + GitHub Pages)

Dette prosjektet er klart for å kjøres fra GitHub Pages og bruker Supabase som database.

## Filer
- `index.html` – selve appen (UI)
- `supabase.js` – kobling til Supabase
- `app-search-supabase.js` – all logikk mot databasen (erstatter LocalStorage)

## Hvordan publisere
1. Opprett (eller bruk) repo `Vogn` på GitHub.
2. Last opp alle filene i denne mappen.
3. Slå på **GitHub Pages**: Settings → Pages → Source: `Deploy from a branch`, Branch: `main` (folder `/root`).
4. Åpne siden: `https://<ditt-brukernavn>.github.io/Vogn/`

## Supabase-krav
Kjør SQL-en som ble delt tidligere for å opprette tabellene `people`, `carts`, `transactions`, aktivere RLS og policy `Allow all` på alle tre tabeller.

## Konfigurasjon
I `supabase.js` er SUPABASE_URL og SUPABASE_KEY allerede satt opp.
