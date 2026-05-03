import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Clock, Home } from "lucide-react";
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
    const articleId = "ld-blog-post";
    const faqId = "ld-blog-faq";
    document.getElementById(articleId)?.remove();
    document.getElementById(faqId)?.remove();

    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.dateISO,
      dateModified: post.dateISO,
      author: { "@type": "Organization", name: "Mike's Mobile Auto Repair" },
      publisher: {
        "@type": "Organization",
        name: "Mike's Mobile Auto Repair",
        logo: { "@type": "ImageObject", url: `${SITE}/favicon.ico` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
      keywords: post.tags.join(", "),
      articleSection: "Auto Repair",
    };
    const a = document.createElement("script");
    a.type = "application/ld+json";
    a.id = articleId;
    a.text = JSON.stringify(article);
    document.head.appendChild(a);

    let f: HTMLScriptElement | null = null;
    if (post.faqs && post.faqs.length) {
      const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      };
      f = document.createElement("script");
      f.type = "application/ld+json";
      f.id = faqId;
      f.text = JSON.stringify(faq);
      document.head.appendChild(f);
    }
    return () => {
      a.remove();
      f?.remove();
    };
  }, [post]);



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
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <li>
                <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">
                  <Home className="w-3.5 h-3.5" /> Home
                </Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li>
                <Link to="/blog" className="hover:text-primary">Blog</Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground line-clamp-1" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

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

          {post.faqs && post.faqs.length > 0 && (
            <section className="mt-12 border-t border-border pt-8" aria-labelledby="post-faq">
              <h2 id="post-faq" className="font-display text-2xl md:text-3xl text-gold mb-4">
                Frequently asked questions
              </h2>
              <div className="space-y-4">
                {post.faqs.map((q) => (
                  <details key={q.question} className="rounded-lg border border-border p-4 group">
                    <summary className="cursor-pointer font-medium text-foreground group-open:text-primary">
                      {q.question}
                    </summary>
                    <p className="mt-2 text-foreground/80 leading-relaxed">{q.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <InlineCallStrip label="Need help with your car right now?" />

          <div className="my-12">
            <RequestQuoteCTA serviceName={`Blog: ${post.title}`} />
          </div>

          <nav
            aria-label="Post navigation"
            className="border-t border-border pt-8 grid sm:grid-cols-2 gap-4 mb-10"
          >
            {prev ? (
              <Link
                to={`/blog/${prev.slug}`}
                className="group rounded-lg border border-border p-4 hover:border-primary/60 transition-colors"
              >
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous
                </span>
                <span className="block mt-1 font-medium text-foreground group-hover:text-primary">
                  {prev.title}
                </span>
              </Link>
            ) : <span className="hidden sm:block" />}
            {next ? (
              <Link
                to={`/blog/${next.slug}`}
                className="group rounded-lg border border-border p-4 hover:border-primary/60 transition-colors sm:text-right"
              >
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground sm:justify-end sm:w-full">
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="block mt-1 font-medium text-foreground group-hover:text-primary">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </nav>

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
