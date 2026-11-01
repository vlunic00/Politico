# Political overview sources

Leadership, orientation, parliamentary and portrait records were manually checked on **24 October 2026**. Government terms and coalition records were separately verified on **1 November 2026**; see [government history sources](./government-history.md). The overview uses factual snapshots, not live or synthetic political data. Update the relevant data module and verify the original records before changing its verification date. Future automated political ingestion should replace these manual snapshots.

## Government

- [Prime minister — Government of Croatia](https://www.vlada.gov.hr/predsjednik-vlade-65/65): Andrej Plenković and his current role.
- [Official biography](https://vlada.gov.hr/the-prime-minister/14973): party leadership and membership.
- [Sabor confidence vote on 17 May 2024](https://sabor.hr/hr/sjednice-sabora/predstavljanje-vlade-republike-hrvatske-i-glasovanje-o-povjerenju-vladi-republike-8): start of this administration, separate from the earlier terms.

Phase 3 adds sourced HDZ–DP coalition records and government history in `src/lib/governments.ts`, separate from parliamentary seat counts and confidence support. Current cabinet membership links to the official government directory; selected dated changes are recorded on the timeline. These are reviewed editorial records, not an automated feed or a complete record of every confidence-supporting MP.

## Parliamentary membership

[Sabor statistical indicators](https://www.sabor.hr/hr/zastupnici/statisticki-pokazatelji), published **24 August 2026**, are the source for 21 named parties, 139 party-affiliated mandates and 11 independent MPs. The published table uses **150 mandates** as its denominator. The UI calculates `party mandates / 150 × 100`, formatted to two decimal places. This is the share of that dated table, not vote share, a forecast, or a claim about today's composition.

Overview preserves the source table's order and places HDZ in the government hero. The remaining 20 parties are available in a keyboard-scrollable card row. The full party page uses alphabetical order. Other parties in the row are not automatically labelled opposition. The separately named party “stranka Nezavisni” is distinct from the 11 independent MPs.

This parliamentary list is distinct from the official registry. Phase 4 imports the complete ministry export through data.gov.hr, including nonparliamentary and ceased records. An explicit `SBT_ID` crosswalk connects the 21 parliamentary entries without guessing from names or abbreviations. See [registry provenance and limitations](./party-directory.md).

## Leadership and orientation

Party profiles link directly to verified official leadership sources. Možemo! has two coordinators, both shown with equal space, rather than an invented sole leader. Leadership and orientation for other parties remain unavailable until verified.

Orientation labels are explicitly marked **self-description** and linked to the original statement. They are not inferred from the party name or from parliamentary membership. The data module records the classification method and source; the shared verification date applies to these entries.

## Media

Six licensed portraits are stored in `public/portraits/`. Credits, original file pages and license links are in `src/lib/politics.ts` and publicly displayed at `/sources#portraits`. Wikimedia thumbnails are used for the party cards; the government portrait retains its downloaded resolution. CSS adjusts crop and adds a gradient without changing the source files.

Attribution covers Damir Sencar / European Commission (Plenković, CC BY 4.0), Social Democratic Party of Croatia (Hajdaš Dončić, CC BY 2.0), Timy Šarec (Benčić, CC BY-SA 4.0), Možemo! (Tomašević, CC BY-SA 4.0), PIXSELL (Penava, CC BY 3.0), and Patrik Macek / PIXSELL (Grmoja, CC BY 3.0). The source file pages retain the original license and authorship information. Photographs do not imply endorsement of the project.
