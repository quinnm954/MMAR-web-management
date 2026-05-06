import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { localLandingPages } from "@/data/localLandingPages";

const LocalServicesDropdown = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localLandingPages;
    return localLandingPages.filter(
      (p) =>
        p.h1.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <details className="border-t border-border pt-6 mb-6 group">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <h3 className="font-display text-sm uppercase tracking-wider text-gold">
          Local Mobile Services
        </h3>
        <span
          className="text-muted-foreground text-xs transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          ▼
        </span>
      </summary>

      <div className="mt-4">
        <label htmlFor="local-services-search" className="sr-only">
          Search services or cities
        </label>
        <input
          id="local-services-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a service or city…"
          className="w-full sm:max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No matches for “{query}”.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            {filtered.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/${p.slug}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {p.h1}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
};

export default LocalServicesDropdown;
