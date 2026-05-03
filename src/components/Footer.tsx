import { Link } from "react-router-dom";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import { categories } from "@/data/serviceCategories";
import { cities } from "@/data/cities";

const Footer = () => {
  return (
    <footer className="pt-12 pb-6 border-t border-border bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <img
              src={mmarLogo}
              alt="MMAR Logo"
              className="h-12 w-auto rounded mb-3"
            />
            <p className="text-sm text-muted-foreground">
              Mobile auto repair across Southwest Florida.
            </p>
            <a
              href="tel:8135017572"
              className="block mt-3 text-primary hover:underline text-sm font-medium"
            >
              (813) 501-7572
            </a>
          </div>

          <div>
            <h3 className="font-display text-sm uppercase tracking-wider text-gold mb-3">
              Service Areas
            </h3>
            <ul className="space-y-2 text-sm">
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
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-display text-sm uppercase tracking-wider text-gold mb-3">
              Services
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Capital Services Management, INC. All rights reserved.
          </p>
          <span>Southwest Florida</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
