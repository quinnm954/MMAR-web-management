import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Calendar, ChevronRight, Clock, Home, Tag } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import InlineCallStrip from "@/components/InlineCallStrip";
import { blogPosts } from "@/data/blogPosts";
import { useSeo } from "@/lib/useSeo";
import NotFound from "./NotFound";

const SITE = "https://mikesmautorepair.com";

const slugifyTag = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const TAG_INTROS: Record<string, { title: string; intro: string; related: { href: string; label: string }[] }> = {
  diagnostics: {
    title: "Mobile Diagnostics & Troubleshooting",
    intro:
      "Check engine lights, no-start issues, electrical gremlins — these articles walk through how to diagnose the most common problems we see across Lehigh Acres, Fort Myers, and Cape Coral. Need hands-on help? Our mobile diagnostic service comes to your driveway with the same scan tools the dealership uses.",
    related: [
      { href: "/mobile-vehicle-diagnostics", label: "Mobile Vehicle Diagnostics" },
      { href: "/mobile-engine-diagnostics", label: "Mobile Engine Diagnostics" },
      { href: "/mobile-no-start-diagnostics", label: "Mobile No-Start Diagnostics" },
    ],
  },
  electrical: {
    title: "Mobile Electrical Repair",
    intro:
      "Batteries, alternators, starters, and charging-system problems make up roughly a third of all mobile mechanic calls in Southwest Florida. These guides explain the symptoms, the real causes, and what a mobile electrical repair actually costs.",
    related: [
      { href: "/services/electrical", label: "Mobile Electrical Service" },
      { href: "/mobile-alternator-repair", label: "Mobile Alternator Repair" },
      { href: "/mobile-battery-replacement", label: "Mobile Battery Replacement" },
      { href: "/mobile-starter-repair", label: "Mobile Starter Repair" },
    ],
  },
  cooling: {
    title: "Cooling System & Overheating",
    intro:
      "Florida heat is brutal on cooling systems. These articles cover overheating causes, what to do when your temperature gauge climbs, and how mobile cooling-system service works.",
    related: [
      { href: "/services/cooling", label: "Cooling System Service" },
      { href: "/services/ac-heating", label: "Mobile AC & Heating" },
    ],
  },
  maintenance: {
    title: "Car Maintenance Tips",
    intro:
      "Routine maintenance keeps SWFL vehicles on the road longer in our heat, humidity, and salt air. These guides explain what to service and when — and how to do most of it without ever visiting a shop.",
    related: [
      { href: "/services/oil-fluids", label: "Mobile Oil & Fluid Services" },
      { href: "/services/inspections", label: "Mobile Inspections" },
      { href: "/mobile-oil-change", label: "Mobile Oil Change" },
    ],
  },
  local: {
    title: "Southwest Florida Car Care",
    intro:
      "Local conditions — salt air, year-round heat, season traffic — affect every vehicle in Lehigh Acres and Fort Myers. These articles focus on what that means for your car.",
    related: [
      { href: "/areas/lehigh-acres", label: "Lehigh Acres" },
      { href: "/areas/fort-myers", label: "Fort Myers" },
    ],
  },
  "no-start": {
    title: "Car Won't Start? No-Start Diagnosis",
    intro:
      "Single click, no crank, dead dash, or engine spins but won't fire — every no-start has a different cause. These articles walk through how to figure out which one you have, and how a mobile mechanic can fix most of them on the spot.",
    related: [
      { href: "/mobile-no-start-diagnostics", label: "Mobile No-Start Diagnostics" },
      { href: "/mobile-battery-replacement", label: "Mobile Battery Replacement" },
      { href: "/mobile-starter-repair", label: "Mobile Starter Repair" },
    ],
  },
};

const BlogTag = () => {
  const { tag = "" } = useParams();
  const tagSlug = tag.toLowerCase();

  // Find original tag label from posts
  const allTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags)));
  const matchedLabel = allTags.find((t) => slugifyTag(t) === tagSlug);

  const meta = matchedLabel
    ? (TAG_INTROS[tagSlug] ?? {
        title: `${matchedLabel} Articles`,
        intro: `Mobile mechanic articles tagged ${matchedLabel} from Mike's Mobile Auto Repair, serving Lehigh Acres, Fort Myers, Cape Coral, and all of Southwest Florida.`,
        related: [] as { href: string; label: string }[],
      })
    : { title: "", intro: "", related: [] as { href: string; label: string }[] };

  const posts = matchedLabel ? blogPosts.filter((p) => p.tags.includes(matchedLabel)) : [];

  useSeo({
    title: matchedLabel
      ? `${meta.title} | Mike's Mobile Auto Repair Blog`
      : "Topic not found",
    description: meta.intro.slice(0, 158),
    canonical: matchedLabel ? `${SITE}/blog/tag/${tagSlug}` : undefined,
  });

  useEffect(() => {
    if (!matchedLabel) return;
    const id = "ld-blog-tag-breadcrumb";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: matchedLabel, item: `${SITE}/blog/tag/${tagSlug}` },
      ],
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => s.remove();
  }, [matchedLabel, tagSlug]);

  if (!matchedLabel) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <li>
                <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">
                  <Home className="w-3.5 h-3.5" /> Home
                </Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground" aria-current="page">{matchedLabel}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-2 text-gold mb-3">
            <Tag className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Topic</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">{meta.title}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-3xl">{meta.intro}</p>

          {meta.related.length > 0 && (
            <div className="mb-10 rounded-lg border border-border/50 p-4 bg-card/40">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Related services</p>
              <ul className="flex flex-wrap gap-2">
                {meta.related.map((r) => (
                  <li key={r.href}>
                    <Link
                      to={r.href}
                      className="inline-block px-3 py-1.5 rounded-full text-sm border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="glass-card rounded-xl p-6 border border-border/40 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.dateISO).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readMinutes} min read
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12">
            <InlineCallStrip label="Need a mobile mechanic right now?" />
          </div>
        </div>
      </section>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default BlogTag;
