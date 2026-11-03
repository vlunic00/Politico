import { coverageLabel, proposalKindLabel, summaryTopics, type PublicSummary, type SummaryContent } from "@/lib/parties/summary-contract";
import { formatDate } from "@/lib/statistics/series";

export function SummarySection({ section, documentUrl }: { section: SummaryContent["sections"][number]; documentUrl: string }) {
  if (!section.proposals.length) return <p className="subtle">{coverageLabel(section.coverage)}.</p>;
  return <div className="space-y-4">{section.proposals.map((proposal, index) => <div key={index}>
    <p className="text-sm leading-6">{proposal.text}</p><p className="subtle mt-1">{proposalKindLabel(proposal.kind)} · prema programu</p>
    {proposal.evidence.map((evidence, index) => <details key={index} className="mt-2 text-xs"><summary className="cursor-pointer text-primary underline underline-offset-4">Dokaz · PDF str. {evidence.page}</summary><blockquote className="mt-2 border-l-2 pl-3 text-sm leading-6">„{evidence.quote}”</blockquote><a href={`${documentUrl.split("#")[0]}#page=${evidence.page}`} className="text-link mt-2 text-xs" target="_blank" rel="noreferrer">Izvorni program · PDF str. {evidence.page} ↗</a></details>)}
  </div>)}</div>;
}

export function ProgramSummary({ summary, documentUrl }: { summary: PublicSummary; documentUrl: string }) {
  return <section id={`summary-${summary.id}`} className="mt-6 border-t pt-5" aria-label={`Odobreni AI sažetak ${summary.sequence}`}>
    <h5 className="text-sm font-semibold">AI sažetak · hrvatski · izdanje {summary.sequence}</h5>
    <p className="subtle mt-2">Ljudski pregledan i odobren <time dateTime={summary.publishedAt}>{formatDate(summary.publishedAt)}</time>. Generirano <time dateTime={summary.generatedAt}>{formatDate(summary.generatedAt)}</time> · {summary.modelIdentifier} · {summary.promptVersion}. Sažetak je tumačenje programa; za provjeru koristite izvorni dokument.</p>
    <div className="mt-5 grid gap-6 md:grid-cols-2">{summary.content.sections.map((section) => <div key={section.topic}><h6 className="mb-2 text-sm font-semibold">{summaryTopics[section.topic]}</h6><SummarySection section={section} documentUrl={documentUrl} /></div>)}</div>
  </section>;
}
