import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import InlineCallStrip from "@/components/InlineCallStrip";
import { getBlogPostBySlug, blogPosts } from "@/data/blogPosts";
import { useSeo } from "@/lib/useSeo";
import NotFound from "./NotFound";

const SITE = "https://www.mikesmautorepair.com";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const post = getBlogPostBySlug(slug);

  useSeo({
    title: post
      ? `${post.title} | Mike's Mobile Auto Repair`
      : "Article Not Found",
    description: post?.excerpt,
    canonical: post ? `${SITE}/blog/${post.slug}` : undefined,
  });

  useEffect(() => {
    if (!post) return;
    const id = "ld-blog-post";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.dateISO,
      dateModified: post.dateISO,
      author: { "@type": "Organization", name: "Mike's Mobile Auto Repair" },
      publisher: { "@type": "Organization", name: "Mike's Mobile Auto Repair" },
      mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => s.remove();
  }, [post]);

  if (!post) return <NotFound />;

  const idx = post ? blogPosts.findIndex((p) => p.slug === post.slug) : -1;
  const prev = idx > 0 ? blogPosts[idx - 1] : null;
  const next = idx >= 0 && idx < blogPosts.length - 1 ? blogPosts[idx + 1] : null;
  const others = post ? blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3) : [];

  useEffect(() => {
    if (!post) return;
    const id = "ld-breadcrumb-blog";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
      ],
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => s.remove();
  }, [post]);

  if (!post) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">{post.title}</span>
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.dateISO).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readMinutes} min read
            </span>
          </div>

          <article
            className="prose prose-invert max-w-none text-foreground/90 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:text-gold [&_h2]:mt-8 [&_h2]:mb-3 [&_a]:text-primary [&_a:hover]:underline [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          <InlineCallStrip label="Need help with your car right now?" />

          <div className="my-12">
            <RequestQuoteCTA serviceName={`Blog: ${post.title}`} />
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="font-display text-xl md:text-2xl text-sky mb-4">
              Keep reading
            </h2>
            <ul className="space-y-3">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default BlogPost;
