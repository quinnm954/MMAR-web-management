import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const DYNAMIC_LD_ID = "ld-dynamic-seo";

export const useSeo = ({ title, description, canonical, noindex, jsonLd }: SeoOptions) => {
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

    if (description) setMeta("description", description);
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");

    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.setAttribute("rel", "canonical");
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute("href", canonical);
    }

    // Cleanup any existing dynamic JSON-LD blocks
    document
      .querySelectorAll(`script[data-seo="${DYNAMIC_LD_ID}"]`)
      .forEach((el) => el.remove());

    const blocks = jsonLd
      ? Array.isArray(jsonLd)
        ? jsonLd
        : [jsonLd]
      : [];
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
  }, [title, description, canonical, noindex, JSON.stringify(jsonLd)]);
};
