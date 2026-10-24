# Political overview sources

Manually checked on **24 October 2026**. The overview uses factual snapshots, not live or synthetic political data. Update `src/lib/politics.ts` and verify the original records before changing the date. Future automated political ingestion should replace this manual snapshot.

## Government

- [Prime minister — Government of Croatia](https://www.vlada.gov.hr/predsjednik-vlade-65/65): Andrej Plenković and his current role.
- [Official biography](https://vlada.gov.hr/the-prime-minister/14973): party leadership and membership.
- [Sabor confidence vote on 17 May 2024](https://sabor.hr/hr/sjednice-sabora/predstavljanje-vlade-republike-hrvatske-i-glasovanje-o-povjerenju-vladi-republike-8): start of this administration, separate from the earlier terms.

The complete current coalition and cabinet have not been verified for this snapshot. They remain unavailable rather than inferred from seat counts or the prime minister's party.

## Parliamentary membership

[Sabor statistical indicators](https://www.sabor.hr/hr/zastupnici/statisticki-pokazatelji), published **24 August 2026**, are the source for 21 named parties, 139 party-affiliated mandates and 11 independent MPs. The published table uses **150 mandates** as its denominator. The UI calculates `party mandates / 150 × 100`, formatted to two decimal places. This is the share of that dated table, not vote share, a forecast, or a claim about today's composition.

Overview preserves the source table's order and places HDZ in the government hero. The remaining 20 parties are available in a keyboard-scrollable card row. The full party page uses alphabetical order. Other parties in the row are not automatically labelled opposition. The separately named party “stranka Nezavisni” is distinct from the 11 independent MPs.

This list is not the official registry of all registered Croatian parties. Non-parliamentary parties and registration status still require the canonical register integration.

## Leadership and orientation

Party profiles link directly to verified official leadership sources. Možemo! has two coordinators, both shown with equal space, rather than an invented sole leader. Leadership and orientation for other parties remain unavailable until verified.

Orientation labels are explicitly marked **self-description** and linked to the original statement. They are not inferred from the party name or from parliamentary membership. The data module records the classification method and source; the shared verification date applies to these entries.

## Media

Six licensed portraits are stored in `public/portraits/`. Credits, original file pages and license links are in `src/lib/politics.ts` and publicly displayed at `/sources#portraits`. Wikimedia thumbnails are used for the party cards; the government portrait retains its downloaded resolution. CSS adjusts crop and adds a gradient without changing the source files.

Attribution covers Damir Sencar / European Commission (Plenković, CC BY 4.0), Social Democratic Party of Croatia (Hajdaš Dončić, CC BY 2.0), Timy Šarec (Benčić, CC BY-SA 4.0), Možemo! (Tomašević, CC BY-SA 4.0), PIXSELL (Penava, CC BY 3.0), and Patrik Macek / PIXSELL (Grmoja, CC BY 3.0). The source file pages retain the original license and authorship information. Photographs do not imply endorsement of the project.
