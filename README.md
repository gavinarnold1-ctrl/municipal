# Municipal

Public accountability and rental transparency tool for New Haven, CT.

- **Rental Lookup** — search any New Haven address, get a landlord report card: owner, complaint history, license status, blight + code citations, risk score.
- **Investigation** — budget signals, FOIA tracker, and findings drawn from the city's own records.

Stack: Next.js 16 (App Router) · Drizzle ORM · Neon Postgres · Tailwind CSS 4 · Vercel.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL + DATABASE_URL_UNPOOLED
pnpm db:push                 # create tables in Neon
pnpm db:seed                 # import CSVs from ~/lci-scraper/
pnpm dev
```

The seed script reads from `~/lci-scraper/lci_data/` (Veoci LCI exports) and
`~/lci-scraper/citysquared_data/` (CitySquared parcel data). Both directories
are scraped offline; CSVs are not committed to this repo.

## Data sources

- New Haven Livable City Initiative — Veoci dashboard (complaints, licenses, anti-blight, code violations)
- CitySquared — parcel registry (20,404 parcels in New Haven)
- City of New Haven monthly financial reports and FY24/FY25 budget books (investigation section)

Municipal is an independent project. Not affiliated with the City of New Haven.

## Project notes

Session contract lives in [`CLAUDE.md`](./CLAUDE.md). Brand guidelines and
project process are mirrored in the Notion workspace.
