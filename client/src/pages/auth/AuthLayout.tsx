import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "../../components/shared/NavBar";

type AuthLayoutProps = {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({
  mode,
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  const isLogin = mode === "login";

  return (
    <>
      <NavBar/>
      <main className="relative min-h-screen overflow-hidden bg-(--surface) selection:bg-[rgba(67,97,238,0.18)]">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
          <div className="grid w-full items-start gap-10 lg:items-center lg:grid-cols-[1.05fr_0.95fr]">
            <section className="order-1">
              <div className="relative mx-auto max-w-xl lg:mx-0">
                <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.7),transparent_70%)] blur-2xl lg:block" />

                <h1 className="mb-5 text-center [font-family:var(--font-reading)] text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl lg:text-left lg:text-6xl lg:leading-[0.95]">
                  Highlight as you read. <br />
                  Review anytime.
                </h1>

                <p className="max-w-lg text-center [font-family:var(--font-ui)] text-base leading-7 text-(--on-surface-muted) sm:text-lg sm:leading-8 lg:text-left">
                  Turn what you read into a personal vocabulary list you can review
                  anytime.
                </p>

              </div>
            </section>

            <section className="order-2 mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <p className="[font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.22em] text-(--on-surface-muted)">
                  {subtitle}
                </p>
              </div>

              <div className="relative rounded-[1.75rem] border border-[rgba(196,197,215,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.78))] p-7 shadow-[0_18px_48px_rgba(28,28,24,0.08)] backdrop-blur-xl md:p-8">
                <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent_38%,transparent_65%,rgba(186,195,255,0.08))]" />
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />

                <div className="relative mb-6">
                  <h2 className="[font-family:var(--font-ui)] text-2xl font-semibold tracking-[-0.02em] text-(--on-surface)">
                    {title}
                  </h2>
                </div>

                <div className="relative">
                  {children}
                </div>

                <div className="relative mt-7 text-center">
                  <p className="[font-family:var(--font-ui)] text-sm text-(--on-surface-muted)">
                    {isLogin ? "New here?" : "Already a reader?"}{" "}
                    <Link
                      to={isLogin ? "/signup" : "/login"}
                      className="font-semibold text-(--primary) transition-colors hover:text-(--primary-container)"
                    >
                      {isLogin ? "Create an account" : "Log in"}
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}