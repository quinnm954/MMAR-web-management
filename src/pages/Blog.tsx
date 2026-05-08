import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, ArrowRight, ArrowLeft, Tag } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import InlineCallStrip from "@/components/InlineCallStrip";
import { blogPosts } from "@/data/blogPosts";
import { useSeo } from "@/lib/useSeo";

const SITE = "https://mikesmautorepair.com";
const PAGE_SIZE = 6;

const slugifyTag = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const SERVICE_LINKS = [
  { href: "/mobile-vehicle-diagnostics", label: "Mobile Diagnostics" },
  { href: "/mobile-brake-repair", label: "Mobile Brake Repair" },
  { href: "/mobile-alternator-repair", label: "Mobile Alternator Repair" },
  { href: "/mobile-battery-replacement", label: "Mobile Battery Replacement" },
  { href: "/mobile-starter-repair", label: "Mobile Starter Repair" },
  { href: "/mobile-oil-change", label: "Mobile Oil Change" },
];

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const sorted = useMemo(
    () => [...blogPosts].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    []
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);

  const allTags = useMemo(
    () => Array.from(new Set(blogPosts.flatMap((p) => p.tags))).sort(),
    []
  );

  const canonical =
    safePage === 1 ? `${SITE}/blog` : `${SITE}/blog?page=${safePage}`;

  useSeo({
    title:
      safePage === 1
        ? "Mobile Mechanic Blog | Lehigh Acres and Fort Myers Auto Repair Tips"
        : `Mobile Mechanic Blog — Page ${safePage} | Mike's Mobile Auto Repair`,
    description:
      "Mobile mechanic guides for Lehigh Acres and Fort Myers — diagnostics, brakes, batteries, alternators, no-start fixes, and Florida-specific car care.",
    canonical,
  });

  // Blog + BreadcrumbList schema
  useEffect(() => {
    const blogId = "ld-blog-list";
    const crumbId = "ld-blog-breadcrumb";
    document.getElementById(blogId)?.remove();
    document.getElementById(crumbId)?.remove();

    const publisher = {
      "@type": "Organization",
      name: "Mike's Mobile Auto Repair",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/mmar-logo.jpeg`,
        width: 600,
        height: 600,
      },
    };
    const blogLd = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Mike's Mobile Auto Repair Blog",
      url: `${SITE}/blog`,
      publisher,
      blogPost: sorted.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title.length > 110 ? p.title.slice(0, 107) + "..." : p.title,
        url: `${SITE}/blog/${p.slug}`,
        mainEntityOfPage: `${SITE}/blog/${p.slug}`,
        datePublished: p.dateISO,
        dateModified: p.dateISO,
        author: { "@type": "Organization", name: "Mike's Mobile Auto Repair", url: SITE },
        publisher,
        image: [`${SITE}/blog-hero.jpg`],
        description: p.excerpt,
      })),
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      ],
    };

    const a = document.createElement("script");
    a.type = "application/ld+json";
    a.id = blogId;
    a.text = JSON.stringify(blogLd);
    document.head.appendChild(a);

    const b = document.createElement("script");
    b.type = "application/ld+json";
    b.id = crumbId;
    b.text = JSON.stringify(breadcrumbLd);
    document.head.appendChild(b);

    return () => {
      a.remove();
      b.remove();
    };
  }, [sorted]);

  const goTo = (n: number) => {
    if (n <= 1) {
      searchParams.delete("page");
      setSearchParams(searchParams);
    } else {
      searchParams.set("page", String(n));
      setSearchParams(searchParams);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">MOBILE MECHANIC</span>{" "}
            <span className="text-gold">BLOG</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-3xl">
            Honest, no-fluff guides from a working mobile mechanic in Southwest
            Florida. Diagnostics walkthroughs, brake and battery advice, no-start
            troubleshooting, and Florida-specific car care for{" "}
            <Link to="/areas/lehigh-acres" className="text-primary hover:underline">Lehigh Acres</Link> and{" "}
            <Link to="/areas/fort-myers" className="text-primary hover:underline">Fort Myers</Link>.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-3xl">
            Need help right now instead of reading? See our{" "}
            <Link to="/mobile-vehicle-diagnostics" className="text-primary hover:underline">mobile diagnostics</Link>,{" "}
            <Link to="/mobile-brake-repair" className="text-primary hover:underline">mobile brake repair</Link>, or{" "}
            mobile mechanic services — or just call <a href="tel:8135017572" className="text-primary hover:underline">(813) 501-7572</a>.
          </p>

          {/* Featured external article */}
          <div className="mb-8 glass-card rounded-xl p-5 md:p-6 border border-primary/40 bg-primary/5">
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-gold">
              <Tag className="w-4 h-4" /> Featured Article
            </div>
            <h2 className="font-display text-lg md:text-2xl text-foreground mb-2">
              How Florida Drivers Can Prevent Roadside Breakdowns
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-3">
              Practical heat, battery, and tire tips from our team — published on Medium.
            </p>
            <a
              href="https://medium.com/@quinnm954/how-florida-drivers-can-prevent-roadside-breakdowns-58c5ea9a452b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
            >
              Read on Medium <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Featured topic: MMAR Care */}
          <div className="mb-8 glass-card rounded-xl p-5 md:p-6 border border-gold/40 bg-gold/5">
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-gold">
              <Tag className="w-4 h-4" /> New Topic
            </div>
            <h2 className="font-display text-lg md:text-2xl text-foreground mb-2">
              MMAR Care — Membership & Customer Portal
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-3">
              Browse every article about our free customer portal, membership plans, and fleet program.
            </p>
            <Link
              to="/blog/tag/mmar-care"
              className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
            >
              View MMAR Care articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Tag cloud */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Tag className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Browse by topic</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <li key={t}>
                  <Link
                    to={`/blog/tag/${slugifyTag(t)}`}
                    className="inline-block px-3 py-1.5 rounded-full text-sm border border-border hover:border-primary/60 hover:text-primary transition-colors"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visible.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="glass-card rounded-xl p-6 border border-border/40 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.dateISO).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readMinutes} min read
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((t) => (
                    <span key={t} className="text-[11px] uppercase tracking-wider text-muted-foreground border border-border/60 rounded px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Blog pagination" className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded border border-border text-sm disabled:opacity-40 hover:border-primary/60"
              >
                <ArrowLeft className="w-4 h-4" /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => goTo(n)}
                  aria-current={n === safePage ? "page" : undefined}
                  className={`px-3 py-2 rounded border text-sm ${
                    n === safePage
                      ? "border-primary text-primary"
                      : "border-border hover:border-primary/60"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => goTo(safePage + 1)}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 rounded border border-border text-sm disabled:opacity-40 hover:border-primary/60"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </nav>
          )}

          {/* Service links footer */}
          <div className="mt-14 border-t border-border pt-8">
            <h2 className="font-display text-xl md:text-2xl text-sky mb-3">Popular mobile services</h2>
            <ul className="flex flex-wrap gap-2">
              {SERVICE_LINKS.map((s) => (
                <li key={s.href}>
                  <Link
                    to={s.href}
                    className="inline-block px-3 py-1.5 rounded border border-border text-sm hover:border-primary/60 hover:text-primary transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <InlineCallStrip label="Want a mobile mechanic to come to you?" />
          </div>
        </div>
      </section>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Blog;
