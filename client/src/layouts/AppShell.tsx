import type { PropsWithChildren, ReactNode } from "react";

export function AppShell({
  sidebar,
  children,
}: PropsWithChildren<{ sidebar: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--surface)] lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
      <main className="min-w-0 bg-[var(--surface)] px-5 py-8 lg:px-8 lg:py-10">
        {children}
      </main>

      <aside className="min-w-0 bg-[var(--surface-container-low)] px-5 py-6 lg:px-5 lg:py-5">
        {sidebar}
      </aside>
    </div>
  );
}