import Link from "next/link";
import { governments, governmentTransitions, governmentComparisonContext } from "@/lib/governments";
import { indicators } from "@/lib/catalogue";
import { getStatistics } from "@/lib/statistics/data";
import { seriesDefinitions } from "@/lib/statistics/definitions";
import { compareGovernmentPeriod, comparisonSelection, governmentRange, nextDay, todayInCroatia } from "@/lib/statistics/government-comparison";
import { formatDate, formatNumber, formatPeriod } from "@/lib/statistics/series";
import { MetricLineChart } from "./metric-line-chart";
import { SourcePopover } from "./source-popover";
import { EmptyState } from "./empty-state";

export async function GovernmentComparison({ query }: { query: Record<string, string | string[] | undefined> }) {
  const today = todayInCroatia();
  const parsed = comparisonSelection(query, today);
  const selection = parsed.success ? parsed.data : comparisonSelection({}, today).data!;
  const statistics = await getStatistics();
  const series = statistics.series[selection.indicator];
  const definition = seriesDefinitions.find((definition) => definition.slug === selection.indicator)!;
  const indicator = indicators.find((indicator) => indicator.slug === selection.indicator)!;
  const selectedGovernments = [selection.first, selection.second].map((id) => governments.find((government) => government.id === id)!);
  const periods = selection.mode === "custom" && selection.start && selection.end
    ? [{ title: "Vlastito razdoblje", range: { start: selection.start, end: nextDay(selection.end) }, government: null }]
    : selectedGovernments.map((government) => ({ title: government.name, range: governmentRange(government, today), government }));
  const control = "min-w-0 w-full rounded-lg border bg-white p-2.5 text-sm";
  const signed = (value: number | null, unit: string) => value === null ? "Nije usporedivo" : `${value > 0 ? "+" : ""}${formatNumber(value)} ${unit}`;

  return (
    <div className="space-y-6">
      <form action="/compare/governments" className="surface grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid min-w-0 gap-2 text-xs">Pokazatelj
          <select aria-label="Pokazatelj" name="indicator" defaultValue={selection.indicator} className={control}>
            {seriesDefinitions.map((definition) => <option key={definition.slug} value={definition.slug}>{indicators.find((indicator) => indicator.slug === definition.slug)?.name}{!statistics.series[definition.slug] && " · nema objavljenih podataka"}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-xs">Način usporedbe
          <select name="mode" defaultValue={selection.mode} className={control}><option value="governments">Dvije administracije</option><option value="custom">Vlastito razdoblje</option></select>
        </label>
        {(["first", "second"] as const).map((name, index) => <label key={name} className="grid min-w-0 gap-2 text-xs">{index === 0 ? "Prva administracija" : "Druga administracija"}
          <select name={name} defaultValue={selection[name]} className={control}>{[...governments].reverse().map((government) => <option key={government.id} value={government.id}>{government.name}</option>)}</select>
        </label>)}
        <label className="grid min-w-0 gap-2 text-xs">Početak vlastitog razdoblja
          <input type="date" name="start" max={today} defaultValue={selection.start} className={control} />
        </label>
        <label className="grid min-w-0 gap-2 text-xs">Kraj vlastitog razdoblja (uključen)
          <input type="date" name="end" max={today} defaultValue={selection.end} className={control} />
        </label>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
          <button type="submit" className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Prikaži usporedbu</button>
          <Link href="/government/history" className="text-link text-xs">Mandati i izvori ↗</Link>
          <p className="subtle">Datumi se koriste samo za vlastito razdoblje. Odabir ostaje u poveznici.</p>
        </div>
      </form>
      {!parsed.success ? <p role="alert" className="surface p-5 text-sm">Nevaljan odabir. Odaberite postojeće administracije i pokazatelj te valjane datume. Početak ne smije biti nakon kraja, a kraj ne smije biti u budućnosti.</p>
        : !series ? <section className="surface"><EmptyState title={statistics.status === "error" ? "Statistička baza privremeno nije dostupna" : "Nema objavljenih podataka za odabrani pokazatelj"} description="Usporedba postaje dostupna nakon uspješnog uvoza i objave validiranih opažanja. Ne nadomještamo ih procjenama." /></section>
        : <>
          <section className="surface p-5 sm:p-7">
            <h2 className="section-title">{indicator.name}</h2>
            <p className="subtle mt-3">{series.definition}</p>
            <p className="subtle mt-2">{series.limitations}</p>
            <p className="subtle mt-3">Razdoblja mogu biti različito duga; promjene nisu godišnje stope uspješnosti. Promjena tijekom mandata ne dokazuje da ju je Vlada uzrokovala.</p>
          </section>
          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
            {periods.map(({ title, range, government }, index) => {
              const result = compareGovernmentPeriod(series, range, definition.change);
              const rows = [
                { label: "Prije početka", hr: result.baseline, eu: result.eu.baseline },
                { label: "Razdoblje koje obuhvaća početak", hr: result.atStart, eu: result.eu.atStart },
                { label: "Zadnje završeno razdoblje unutar odabira", hr: result.end, eu: result.eu.end },
              ];
              return <section key={index} className="surface min-w-0 p-5 sm:p-7" aria-label={title}>
                <h2 className="section-title">{title}</h2>
                <p className="subtle mt-2">{formatDate(range.start)} – {government?.end ? `${formatDate(government.end)} (primopredaja)` : formatDate(selection.mode === "custom" ? selection.end : today)}</p>
                {government && <Link href={`/government/history#${government.id}`} className="text-link mt-3 text-xs">Izvori i koalicijske promjene ↗</Link>}
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">{title}: {indicator.name}</caption>
                    <thead><tr><th scope="col" className="p-2">Opažanje</th><th scope="col" className="p-2">Razdoblje</th><th scope="col" className="p-2">Hrvatska ({series.unit})</th><th scope="col" className="p-2">EU-27 ({series.unit})</th></tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.label} className="border-t">
                      <th scope="row" className="p-2 font-normal">{row.label}</th>
                      <td className="p-2">{row.hr ? formatPeriod(row.hr.periodStart, series.frequency, series.slug) : "Nije dostupno"}</td>
                      <td className="p-2">{row.hr ? `${formatNumber(row.hr.value)}${row.hr.sourceFlags ? ` (${row.hr.sourceFlags})` : ""}` : "Nije dostupno"}</td>
                      <td className="p-2">{row.eu ? `${formatNumber(row.eu.value)}${row.eu.sourceFlags ? ` (${row.eu.sourceFlags})` : ""}` : "Nije dostupno"}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <dl className="mt-5 grid gap-4 rounded-xl bg-background p-4 text-sm sm:grid-cols-2">
                  <div><dt className="subtle">Promjena u Hrvatskoj</dt><dd className="mt-1 font-medium">{signed(result.croatiaChange.relative, result.changeUnit)}</dd></div>
                  <div><dt className="subtle">Promjena u EU-u · ista razdoblja</dt><dd className="mt-1 font-medium">{signed(result.euChange.relative, result.changeUnit)}</dd></div>
                  {definition.change === "percent" && <>
                    <div><dt className="subtle">Apsolutna promjena · Hrvatska</dt><dd className="mt-1">{signed(result.croatiaChange.absolute, series.unit)}</dd></div>
                    <div><dt className="subtle">Apsolutna promjena · EU</dt><dd className="mt-1">{signed(result.euChange.absolute, series.unit)}</dd></div>
                  </>}
                </dl>
                {result.croatiaChange.reason && <p className="subtle mt-3">Hrvatska: {result.croatiaChange.reason}</p>}
                {result.euChange.reason && <p className="subtle mt-3">EU: {result.euChange.reason}</p>}
              </section>;
            })}
          </div>
          <section className="surface min-w-0 p-5 sm:p-7">
            <h2 className="section-title mb-5">Cijela objavljena povijest · {indicator.name}</h2>
            <MetricLineChart title={indicator.name} unit={series.unit} points={series.points} transitions={governmentTransitions} />
            <div className="mt-5"><SourcePopover source={series.source} /></div>
          </section>
        </>}
      <section className="surface p-5 sm:p-7">
        <h2 className="section-title">Povijesni kontekst</h2>
        <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">{governmentComparisonContext.map((event) => <li key={event.date}><time dateTime={event.date}>{formatDate(event.date)}</time> · {event.description}{" "}<a href={event.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Izvor ↗</a></li>)}</ul>
      </section>
      <section id="comparison-methodology" className="surface p-5 sm:p-7">
        <h2 className="section-title">Kako odabiremo opažanja</h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Polazište je zadnje opažanje čije referentno razdoblje završava prije početka mandata. Završna vrijednost dolazi iz zadnjeg završenog razdoblja unutar mandata. Dan primopredaje pripada novoj Vladi. Ne interpoliramo vrijednost na dan stupanja na dužnost i ne koristimo polazište kao zamjenu za nedostajući završetak.</p>
          <p>Opažanje koje obuhvaća početak prikazuje se odvojeno i ne zamjenjuje polazište. Godišnji i tromjesečni podaci mogu obuhvatiti dvije ili više administracija; ne pripisujemo im cijelu godinu. Stanovništvo je stanje 1. siječnja. Ako povijest ne doseže početak mandata, promjena ostaje nedostupna.</p>
          <p>Koristimo najnoviju objavljenu reviziju i referentna razdoblja, a ne rekonstrukciju podataka poznatih na dan imenovanja. Povijesni datumi izvornih objava uglavnom nisu dostupni. EU mora imati iste početne i završne periode, jedinicu, učestalost i metodologiju kao Hrvatska; ne biramo starije EU opažanje radi popunjavanja praznine.</p>
          <p>Promjena = završna vrijednost − polazište. Stope prikazujemo u postotnim bodovima, Gini u bodovima, a razine i indekse i kao postotak početne vrijednosti (uz apsolutni nazivnik). Za nulti nazivnik nema postotne promjene. Preko prekida serije ili različitih definicija ne računamo promjenu. Oznake: p = privremeno, e = procjena, r = revidirano, b = prekid, d = različita definicija.</p>
          <p>EU daje kontekst; ova usporedba ne izdvaja učinak vladine politike. <Link href="/methodology" className="text-link">Metodologija i ispravci ↗</Link></p>
        </div>
      </section>
    </div>
  );
}
