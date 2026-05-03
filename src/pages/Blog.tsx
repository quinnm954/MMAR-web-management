import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { blogPosts } from "@/data/blogPosts";
import { useSeo } from "@/lib/useSeo";

const Blog = () => {
  useSeo({
    title: "Mobile Mechanic Blog | Mike's Mobile Auto Repair",
    description:
      "Auto repair tips, diagnostics guides, and Florida-specific car care advice from Mike's Mobile Auto Repair in Southwest Florida.",
    canonical: "https://www.mikesmautorepair.com/blog",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">MOBILE MECHANIC</span>{" "}
            <span className="text-gold">BLOG</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-10">
            Diagnostics tips, Florida-specific car care, and straight talk from a
            local mobile mechanic.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="glass-card rounded-xl p-6 border border-border/40 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.dateISO).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
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
                <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Blog;
