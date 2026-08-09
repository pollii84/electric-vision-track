# Competitor Research — Cluj-Napoca / Transylvania electrical contractors

First pass, generated via Firecrawl (search + structured extraction) against live competitor
websites. Not exhaustive — a starting map, not a market survey. Re-run periodically; pricing in
particular will drift.

## ⚠ Needs your confirmation

**`iplan.expert`** (the one you named as a known competitor) scraped as **iPlan 360** — a digital
ecosystem product (websites, digital marketing, AI automation/agents for business operations), not
an electrical contractor. Nothing on the page describes electrical installation work. Possibilities:
wrong URL, the company pivoted since you last checked, or it's a different business than intended.
Worth double-checking the actual URL before treating it as a competitor.

## Not a competitor — flagged during research, may still be useful elsewhere

**`clujconstruct.ro`** (listed under "CABLE") is a **materials distributor** — imports/distributes
fiber-optic cable, coaxial cable, solar cable, and electrical equipment — not a competing
installation/contracting business. More relevant as a potential supplier for the Stocks/Purchases
side of the app than as competition.

## Real competitors found

### HomeRun — Cluj-Napoca
- **What they do**: Electrical installations, maintenance packages, safety solutions, free
  consultations.
- **Pricing signal**: Electrical installation jobs quoted **150 – 13,000 Lei**, depending on scope
  — a residential-to-larger-job range, no fixed rate card published.
- Source: homerun.ro/cluj-napoca-instalatii-electrice

### Xander Electric SRL — Cluj-Napoca
- **What they do**: Design and execution of electrical installations — residential, industrial,
  street lighting, smart-home installs, surveillance camera installs.
- **Services**: full rewiring, repairs, new-build installation, panel/breaker board mounting,
  outlet/switch/fixture/chandelier mounting.
- **Pricing signal** (most detailed of the group):
  - Full electrical install for house/villa/apartment: **2,500 – 6,300 Lei**
  - Rewiring per outlet/fixture: **56 – 69 Lei/unit**
- Source: necesit.ro/instalatii-electrice/cluj

### Ianis Electroinstal S.R.L. — Luna de Sus, Cluj county (founded 2020)
- **What they do**: Electrical installations, surveillance systems, repairs, modernization of
  existing installations.
- **Pricing signal**:
  - Device/fixture mounting: **50 – 100 Lei/unit**
  - Light fixture mounting: **45 – 70 Lei/unit**
  - Electrical panel mounting: **900 – 1,000 Lei**
- **Contact**: +40 31 229 8485
- Source: daibau.ro nomenclator listing

### Electro Energetica Instal SRL — Cluj-Napoca
- **What they do**: Electrical installation contractor (thin data — sourced from a business
  registry listing page, not their own site; worth a direct site visit if one exists).
- **Address**: Str. Vânătorului 23, Cluj-Napoca
- Source: listafirme.ro business registry

## Pricing comparison (where data exists)

| Company | Full install (house/apt) | Per-unit (outlet/fixture) | Panel mount |
|---|---|---|---|
| HomeRun | 150 – 13,000 Lei (wide range, scope-dependent) | — | — |
| Xander Electric | 2,500 – 6,300 Lei | 56 – 69 Lei | — |
| Ianis Electroinstal | — | 45 – 100 Lei | 900 – 1,000 Lei |

Xander Electric published the most directly comparable full-job pricing; Ianis Electroinstal
published the most granular per-unit pricing. Useful reference points for sanity-checking your own
quotes on comparable scope.

## Method

Firecrawl `search()` for `"instalatii electrice Cluj-Napoca firma"`, `"electrician autorizat Cluj
Transilvania"`, `"firma electrica industriala Cluj"`, plus the given `iplan.expert` URL. Top
results per query deduped into one candidate list, each scraped with a structured `json` extraction
(company overview, services, service area, pricing signals, contact info) via
`client.scrape(url, { formats: [{ type: 'json', schema: {...} }] })`. Six candidates researched;
four confirmed as genuine electrical-contractor competitors, one flagged as a materials supplier
(not a competitor), one flagged as a likely mismatch pending your confirmation.
