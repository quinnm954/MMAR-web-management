import { useEffect } from "react";

type Breadcrumb = { name: string; url: string };

type SeoOptions = {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  breadcrumbs?: Breadcrumb[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const DYNAMIC_LD_ID = "ld-dynamic-seo";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4c7b5790-8e1a-49ef-a408-bcd46551c2f8";

export const useSeo = ({
  title,
  description,
  canonical,
  noindex,
  ogImage,
  breadcrumbs,
  jsonLd,
}: SeoOptions) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setProp = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setProp("og:description", description);
      setMeta("twitter:description", description);
    }
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    setProp("og:title", title);
    setMeta("twitter:title", title);
    setProp("og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("twitter:card", "summary_large_image");

    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.setAttribute("rel", "canonical");
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute("href", canonical);
      setProp("og:url", canonical);
    }

    // Cleanup any existing dynamic JSON-LD blocks
    document
      .querySelectorAll(`script[data-seo="${DYNAMIC_LD_ID}"]`)
      .forEach((el) => el.remove());

    const blocks: Record<string, unknown>[] = jsonLd
      ? Array.isArray(jsonLd)
        ? [...jsonLd]
        : [jsonLd]
      : [];

    if (breadcrumbs && breadcrumbs.length > 0) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      });
    }

    const scripts: HTMLScriptElement[] = [];
    for (const block of blocks) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.dataset.seo = DYNAMIC_LD_ID;
      s.text = JSON.stringify(block);
      document.head.appendChild(s);
      scripts.push(s);
    }

    return () => {
      document.title = previousTitle;
      scripts.forEach((s) => s.remove());
    };
  }, [
    title,
    description,
    canonical,
    noindex,
    ogImage,
    JSON.stringify(breadcrumbs),
    JSON.stringify(jsonLd),
  ]);
};
