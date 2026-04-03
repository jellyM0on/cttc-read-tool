import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export function NavBar() {
  const location = useLocation();
  const { isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 bg-[rgba(252,249,242,0.82)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            to="/"
            onClick={closeMenu}
            className="[font-family:var(--font-reading)] text-2xl italic text-(--on-surface)"
          >
            Scriptura Lib
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className={`[font-family:var(--font-ui)] text-sm font-semibold transition-colors ${
                isActive("/")
                  ? "border-b-2 border-(--primary) text-(--primary)"
                  : "border-b-2 border-transparent text-(--on-surface-muted) hover:text-(--primary)"
              }`}
            >
              Home
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link
                to="/signup"
                className="hidden [font-family:var(--font-ui)] text-sm font-medium text-(--on-surface-muted) transition-colors hover:text-(--primary) md:inline"
              >
                Sign Up
              </Link>

              <Link
                to="/login"
                className="hidden [font-family:var(--font-ui)] text-sm font-medium text-(--on-surface-muted) transition-colors hover:text-(--primary) md:inline"
              >
                Log In
              </Link>
            </>
          ) : (
            <button
              onClick={signOut}
              className="hidden [font-family:var(--font-ui)] text-sm font-medium text-(--on-surface-muted) transition-colors hover:text-(--primary) md:inline"
            >
              Sign Out
            </button>
          )}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center p-2 text-(--on-surface) transition hover:border-(--primary) hover:text-(--primary) md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <div className="relative h-5 w-5">
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full bg-current transition-transform duration-300 ${
                mobileMenuOpen ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full bg-current transition-opacity duration-300 ${
                mobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full bg-current transition-transform duration-300 ${
                mobileMenuOpen ? "-rotate-45" : "translate-y-2"
              }`}
            />
          </div>
        </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-(--outline) px-6 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-9">
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className={`[font-family:var(--font-ui)] text-sm font-semibold transition-colors ${
                  isActive("/")
                    ? "border-b-2 border-(--primary) text-(--primary)"
                    : "border-b-2 border-transparent text-(--on-surface-muted) hover:text-(--primary)"
                }`}
              >
                Home
              </Link>
            </div>

            {!isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="[font-family:var(--font-ui)] text-sm font-medium text-(--on-surface-muted) transition-colors hover:text-(--primary)"
                >
                  Sign Up
                </Link>

                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="[font-family:var(--font-ui)] text-sm font-medium text-(--on-surface-muted) transition-colors hover:text-(--primary)"
                >
                  Log In
                </Link>
              </div>
            ) : (
              <button
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="text-left [font-family:var(--font-ui)] text-sm font-medium text-(--on-surface-muted) transition-colors hover:text-(--primary)"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}