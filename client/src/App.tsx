import { useState } from "react";
import { AppShell } from "./layouts/AppShell";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Input } from "./components/ui/Input";
import { VocabItem } from "./components/ui/VocabItem";

const sampleVocab = [
  { term: "atheneum", translation: "library / reading room", note: "Saved from page 2" },
  { term: "woven", translation: "interlaced; carefully connected", note: "Saved from page 3" },
  { term: "glare", translation: "harsh brightness", note: "Saved from page 4" },
];

export default function App() {
  const [selected, setSelected] = useState(0);

  return (
    <AppShell
      sidebar={
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <div className="font-ui text-xs font-semibold text-muted-ink">
              Dictionary
            </div>
            <div className="font-ui text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">
              Saved terms
            </div>
          </div>

          <Input placeholder="Search saved words..." />

          <div className="grid gap-3.5">
            {sampleVocab.map((item, index) => (
              <VocabItem
                key={item.term}
                term={item.term}
                translation={item.translation}
                note={item.note}
                active={selected === index}
                onClick={() => setSelected(index)}
              />
            ))}
          </div>

          <div className="glass rounded-xl p-4">
            <div className="mb-1.5 font-ui text-xs font-semibold text-muted-ink">
              Quick action
            </div>
            <div className="mb-2 font-reading text-[1.375rem] leading-[1.2] font-medium text-ink">
              Export highlights
            </div>
            <p className="reader-copy m-0 text-[0.95rem] text-muted-ink">
              Export saved words and phrases to CSV for external review tools.
            </p>
          </div>
        </div>
      }
    >
      <div className="max-w-reader mx-auto grid gap-6">
        <header className="grid gap-2.5">
          <div className="font-ui text-xs font-semibold text-muted-ink">
            Reader
          </div>
          <h1 className="m-0 font-reading text-[2rem] leading-[1.15] font-medium text-ink">
            The Digital Atheneum
          </h1>
          <p className="reader-copy m-0 text-muted-ink">
            A focused reading and language-learning space built around tonal depth,
            serif content, and a calm editorial rhythm.
          </p>
        </header>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid gap-1">
              <div className="font-ui text-xs font-semibold text-muted-ink">
                Current file
              </div>
              <div className="font-reading text-[1.375rem] leading-[1.2] font-medium text-ink">
                The Little Prince.epub
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Upload file</Button>
              <Button>Export CSV</Button>
            </div>
          </div>
        </Card>

        <article className="bg-surface py-2">
          <div className="reader-copy space-y-5">
            <p>
              This is where your EPUB, PDF, or TXT content should render. Keep the
              reader spacious, calm, and highly legible. Use Newsreader for long-form
              content, avoid harsh separators, and let background shifts define
              structure instead of borders.
            </p>

            <p>
              When the user highlights a word, sentence, or phrase, store it as a
              saved item and surface it in the dictionary panel. That panel should
              feel like a quiet companion to the reading experience, not a competing
              dashboard.
            </p>

            <p>
              Floating translation popovers can use a blurred glass treatment, while
              active saved vocabulary items can use a slightly darker surface layer
              to show selection.
            </p>
          </div>
        </article>
      </div>
    </AppShell>
  );
}