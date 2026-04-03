import { NavBar } from "../../components/shared/NavBar";

function HeroSection() {
  return (
    <section className="max-w-3xl">
      <div className="mb-3 [font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.18em] text-(--on-surface-muted)">
        Home
      </div>

      <h1 className="[font-family:var(--font-reading)] text-5xl leading-[1.02] font-medium tracking-[-0.03em] text-(--on-surface) md:text-6xl">
        Welcome to your <span className="italic text-(--primary)">Library</span>.
      </h1>

      <p className="mt-5 max-w-2xl [font-family:var(--font-ui)] text-xl leading-9 text-(--on-surface-muted)">
        Upload a text, read a book, and build your own vocabulary archive.
      </p>
    </section>
  );
}

export function HomePage() {

  return (
    <>
      <NavBar/>
      <main className="min-h-screen bg-(--surface) text-(--on-surface)">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-8 lg:px-8 lg:py-10">
          <HeroSection />
        </div>
      </main>
    </>
   
  );
}

