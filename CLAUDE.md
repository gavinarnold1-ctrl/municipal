# CLAUDE.md — Municipal

@AGENTS.md

## What this is
Public accountability and rental transparency tool for New Haven, CT.
Next.js 16 (App Router) + Drizzle ORM + Neon PostgreSQL + Tailwind CSS 4 + Vercel.

## Repo structure
```
municipal/
├── CLAUDE.md                 # This file — session contract
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing — rental address search
│   │   ├── address/[id]/     # Landlord report card for an address
│   │   ├── landlord/[id]/    # Landlord portfolio view (all properties)
│   │   ├── investigation/    # Budget analysis, FOIA tracker, findings
│   │   └── api/              # API routes
│   ├── components/           # Shared React components
│   ├── db/                   # Drizzle schema, connection, seed scripts
│   │   ├── schema.ts         # Database schema
│   │   ├── index.ts          # DB connection
│   │   ├── seed.ts           # CSV import script
│   │   └── migrations/       # Drizzle migrations
│   └── lib/                  # Utilities, scoring, constants
├── data/                     # CSV data files (gitignored, pulled from lci-scraper)
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Standing rules
1. **Read this file first** every session.
2. **Never mark anything Done** — only Gavin does that.
3. **TypeScript strict mode.** No `any` types.
4. **Server Components by default.** Client Components only when you need interactivity.
5. **No Prisma.** We use Drizzle ORM with `@neondatabase/serverless`.
6. **Tailwind CSS 4** — utility-first via `@theme` in globals.css, no CSS modules.
7. **Data is public records.** Everything we display is from public FOIA responses or public-facing city dashboards. No private data.
8. All monetary values in the investigation section must cite their source (budget page number, ACFR line item, monthly financial report).
9. **Post-session protocol:** Update Notion changelog, note what changed, what's left.

## Database
- `DATABASE_URL` = pooled (for app queries)
- `DATABASE_URL_UNPOOLED` = direct (for migrations only)
- Drizzle Kit uses `DATABASE_URL_UNPOOLED` for `drizzle-kit push`

## Key conventions
- Address normalization: uppercase, "AVE" not "AVENUE", "ST" not "STREET" (matches CitySquared format)
- Risk score formula: open_complaints × 3 + expired_licenses × 2 + unresolved_blight × 2 + pending_violations × 2 + total_complaints
- LLC network detection: group by substring match on owner name (NETZ*, SFR*, ABCD*, etc.)
- Fiscal years: July 1 – June 30 (FY2024-25 = Jul 2024 – Jun 2025)

## Brand
Full guidelines: https://www.notion.so/360dd96dd6e28153a033c12422913931

**Colors (dark mode first):**
- Background: Ink `#0C0F12` | Cards: Slate `#1A1F26` | Borders: Steel `#2A3240`
- Text: Paper `#E8ECF0` (primary), Fog `#9EAAB8` (body), Ash `#6B7A8D` (secondary)
- Accent: Copper `#C87941` (links, active states)
- Risk: Red `#D64545`, Orange `#E08A3E`, Yellow `#D4A843`, Green `#4A9A5B`

**Typography:**
- Headlines: Source Serif 4 (700/600) — editorial authority
- Data/UI/body: Inter (400/500/600) — neutral precision
- No Fraunces, no DM Sans (those are Oversikt)

**Shape:** Card radius 8px, button 6px, badge 4px. One shadow: `0 1px 3px rgba(0,0,0,0.3)`. Max-width 960px.

**Voice:** Facts, not editorials. "952 complaints unresolved. Oldest: 2010." Not "The city is failing tenants!"

**NOT Oversikt.** No greens, no Fjord blue, no soft rounded cards. Municipal is a public record interface — evidence room, not clean home.

## Notion workspace
- Main page: https://www.notion.so/34cdd96dd6e281f99571d8ed175caae5
- FOIA Tracker: data_source_id 06fafdbf-d6b9-4588-897f-f955c785761b
- Worst Offenders: data_source_id 913c8e8b-7bd1-4523-9734-4ce8f235939c
- Process follows the Notion → GitHub pattern from Oversikt

## Active sprint
**V1 MVP — Rental Lookup**
- [ ] Database schema + seed from CSVs
- [ ] Address search (landing page)
- [ ] Landlord report card (/address/[id])
- [ ] Landlord portfolio view (/landlord/[id])
- [ ] Risk score calculation
- [ ] LLC network detection + display
- [ ] Investigation section (static content from Notion analysis)
