import { Link } from "react-router-dom";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import { categories } from "@/data/serviceCategories";
import { cities } from "@/data/cities";
import LocalServicesDropdown from "@/components/footer/LocalServicesDropdown";

const Footer = () => {
  return (
    <footer className="pt-12 pb-6 md:pb-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-border bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <img
              src={mmarLogo}
              alt="Mike's Mobile Auto Repair logo — mobile mechanic in Lehigh Acres FL"
              className="h-12 w-auto rounded mb-3"
            />
            <p className="text-sm font-semibold text-foreground">
              Mike's Mobile Auto Repair LLC
            </p>
            <p className="text-sm text-muted-foreground">
              Mobile auto repair across Lee County, FL — Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, and Estero.
            </p>
            <a
              href="tel:8135017572"
              className="block mt-2 text-primary hover:underline text-sm font-medium"
            >
              Call: (813) 501-7572
            </a>
            <a
              href="sms:8135017572"
              className="block text-primary hover:underline text-sm font-medium"
            >
              Text: (813) 501-7572
            </a>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              <span className="block"><span className="font-semibold text-foreground/80">Hours:</span> 9am–5pm daily · By appointment only</span>
              <span className="block mt-1"><span className="font-semibold text-foreground/80">Service area:</span> All of Lee County, FL — Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, Estero</span>
            </p>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Reviews &amp; Social</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a href="https://share.google/bx2Gb42dslCITJdS8" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">Google</a>
                <a href="https://www.facebook.com/Mikesmobileautorepairllc/" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">Facebook</a>
                <a href="https://www.tiktok.com/@mmarllc" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">TikTok</a>
                <a href="https://www.yelp.com/biz/mikes-mobile-auto-repair-lehigh-acres" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">Yelp</a>
                <a href="https://nextdoor.com/page/mikes-mobile-auto-repair-llc-lehigh-acres-fl" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">Nextdoor</a>
              </div>
            </div>
          </div>

          <div>
            <details className="group">
              <summary className="font-display text-sm uppercase tracking-wider text-gold mb-3 cursor-pointer list-none flex items-center justify-between hover:text-primary">
                Service Areas
                <span className="text-xs transition-transform group-open:rotate-180">▾</span>
              </summary>
              <ul className="space-y-2 text-sm mt-2">
                {cities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/areas/${c.slug}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {c.name}, {c.state}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/lee-county-fl"
                    className="text-gold hover:text-primary font-semibold"
                  >
                    All of Lee County, FL →
                  </Link>
                </li>
              </ul>
            </details>
          </div>

          <div className="md:col-span-2">
            <details className="group">
              <summary className="font-display text-sm uppercase tracking-wider text-gold mb-3 cursor-pointer list-none flex items-center justify-between hover:text-primary">
                Services
                <span className="text-xs transition-transform group-open:rotate-180">▾</span>
              </summary>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-2">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/services/${cat.id}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {cat.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        <LocalServicesDropdown />

        <div className="border-t border-border pt-6 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/blog" className="text-muted-foreground hover:text-primary">Blog</Link>
          <Link to="/install" className="text-muted-foreground hover:text-primary">Install App</Link>
          <Link to="/warranty-policy" className="text-muted-foreground hover:text-primary">Warranty Policy</Link>
          <a href="tel:8135017572" className="text-muted-foreground hover:text-primary">(813) 501-7572</a>
          <a href="sms:8135017572" className="text-muted-foreground hover:text-primary">Text Us</a>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Capital Services Management, INC. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span>Lehigh Acres and Fort Myers</span>
            <span aria-hidden="true">·</span>
            <Link
              to="/login"
              className="text-muted-foreground/60 hover:text-primary transition-colors"
              aria-label="Staff login"
            >
              Staff
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
