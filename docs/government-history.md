# Phase 3: government history and comparisons

Government and coalition sources checked **1 November 2026**. `src/lib/governments.ts` follows the existing dated editorial-record pattern. Git preserves editorial changes; these records do not require a database migration or an ingestion job. The parliamentary/leadership snapshot retains its separate 24 October verification date.

## Administration sources

| Administration | Start | Handover to successor | Official record |
| --- | --- | --- | --- |
| Zoran Milanović (12th) | 2011-12-23 | 2016-01-22 | [Government archive](https://vlada.gov.hr/o-vladi/clanovi-vlade/sazivi-vlada-93/12-vlada-rh/19501) |
| Tihomir Orešković (13th) | 2016-01-22 | 2016-10-19 | [Government archive](https://vlada.gov.hr/o-vladi/clanovi-vlade/sazivi-vlada-93/13-vlada-rh/19500) |
| Andrej Plenković I (14th) | 2016-10-19 | 2020-07-23 | [Government archive](https://vlada.gov.hr/o-vladi/clanovi-vlade/sazivi-vlada-93/14-vlada-rh/44283) |
| Andrej Plenković II (15th) | 2020-07-23 | 2024-05-17 | [Government archive](https://vlada.gov.hr/o-vladi/clanovi-vlade/sazivi-vlada-93/15-vlada-rh/44284) |
| Andrej Plenković III (16th) | 2024-05-17 | Ongoing at verification | [Sabor confidence vote](https://www.sabor.hr/hr/sjednice-sabora/predstavljanje-vlade-republike-hrvatske-i-glasovanje-o-povjerenju-vladi-republike-8) |

Each record links its original government program. Historical cabinet archives document member changes; the current term links the [official cabinet directory](https://vlada.gov.hr/clanovi-vlade/128). Timeline events are selected, sourced changes, not a claim to list every appointment. Earlier governments are outside this initial historical coverage.

## Coalition and confidence evidence

- The [official overview](https://www.vlada.gov.hr/prethodne-vlade-11348/11348) identifies Milanović's SDP/HNS/IDS/HSU coalition and Orešković's Domoljubna coalition/Most framework. An electoral alliance is not a single political party, and a coalition partner need not hold a ministry.
- [Sabor's 16 June 2016 no-confidence vote](https://www.sabor.hr/hr/sjednice-sabora/prijedlog-za-pokretanje-pitanja-povjerenja-predsjedniku-vlade-republike-hrvatske-1) is distinct from the October handover. The subsequent interval is labelled caretaker service, without claiming continued coalition agreement.
- [The 27 April 2017 dismissal announcement](https://vlada.gov.hr/vijesti/predsjednik-vlade-plenkovic-potrebna-vecina-postoji-hdz-nastavlja-voditi-vladu-i-politiku-stabilnosti/20567) documents the break with Most. The cabinet archive separately dates Ivan Kovačić's departure to 28 April. HNS participation is shown from [the 9 June confirmation of new ministers](https://vlada.gov.hr/seven-new-ministers-appointed-by-parliament/21815), rather than inventing a date from parliamentary totals.
- The [2020 appointment report](https://vlada.gov.hr/new-croatian-government-voted-in/30029) identifies HDZ and SDSS cabinet participation. The entry explicitly distinguishes this from the wider confidence-supporting majority.
- The [2024 coalition account](https://vlada.gov.hr/bacic-medju-strankama-u-parlamentarnoj-vecini-uvijek-je-nuzan-kompromis-kako-bi-se-nastavilo-suradjivati/42606) documents HDZ/DP cooperation. A [25 February 2026 government report](https://vlada.gov.hr/zastupnica-boska-ban-od-danas-je-dio-parlamentarne-vecine-dabro-ni-formalno-nije-presudan-za-stabilnost-vlade/46237) separately documents Boška Ban joining the majority and discussions with DP and HSLS. Joining the majority is not a cabinet appointment.

Coalition intervals describe the documented framework and events, not continuous proof of every party's support or an exhaustive roll of MPs. Unverified additional membership is not inferred. Refresh these manual records when official changes occur.

## Statistical boundary rules

- Reuse the newest whole published statistical revision. No imports, writes or external API requests occur on comparison page loads.
- Government intervals are `[start, handover)`. Caretaker service remains with the outgoing administration. The open term is capped at today's date in Europe/Zagreb; custom end dates are inclusive. URL dates, IDs, indicator selections and duplicate parameters are validated.
- Baseline: last observation with a full reference period ending strictly before the start. The period containing the start is displayed separately. Endpoint: last fully ended reference period within the interval. Never replace a missing endpoint with the baseline or a missing baseline with a later observation.
- Annual and quarterly observations can overlap administrations. The initial 2015 history cannot supply a full-term baseline for the 2011 administration. Annual population is a special case: its effective reference date is 1 January, not 31 December.
- This is a retrospective comparison of reference periods using the latest revised data. Original historical release dates are generally unknown, so the UI explicitly does not claim to reconstruct what was known on inauguration day.
- Absolute change is endpoint minus baseline. Rate differences use percentage points, Gini uses points; levels and indices also show `(endpoint − baseline) / abs(baseline) × 100`. A zero denominator suppresses only the percentage. Different methodologies, units, frequencies, or intervening `b`/`d` flags suppress changes.
- EU endpoints must match Croatia's exact period boundaries, frequency, unit and methodology, with no different-definition flag. A missing current EU period never falls back to an older EU period. EU breaks are checked independently.
- Charts preserve gaps and display the complete published history, with vertical markers placed at actual inauguration dates on a date axis, not snapped to a year or quarter. The accessible transition list and data table expose dates, values and source flags.
- No scores, trend colors, causal attribution or annualized government rankings are calculated. The two terms may cover different durations.

The comparison includes separately sourced context: [EU accession and euro/Schengen dates](https://european-union.europa.eu/principles-countries-history/eu-countries/croatia_hr), [WHO's pandemic characterization](https://www.who.int/europe/emergencies/situations/covid-19/), and [Russia's full-scale invasion of Ukraine](https://www.consilium.europa.eu/hr/policies/sanctions-against-russia-explained/). These notes do not estimate effects on any indicator.

## Validation and next phase

Unit tests exercise monthly/quarterly/annual boundaries, population stocks, missing observations, zero denominators, incompatible EU observations, independent source breaks, malformed/repeated query inputs and record consistency. Desktop/mobile browser tests exercise history links, form submissions, URL persistence, custom dates, actual GDP periods, chart markers, unavailable older wage history and accessibility.

Phase 4 now adds the canonical party-register import, status filters, persistent registration/program records, program versioning and party comparison; see [party directory contracts](./party-directory.md). Phase 5 is next. Automated refresh of other political facts, authenticated editorial workflows, scheduling and production deployment remain later work.
