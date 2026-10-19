import RegionHome from "@/components/home/RegionHome";
import { southFloridaCities } from "@/data/citiesSouthFlorida";
import { SOUTH_FLORIDA_WEBSITE_LIVE } from "@/lib/regions";
import { trackConversion } from "@/lib/gtag";
import { useSeo } from "@/lib/useSeo";

const SITE = "https://mikesmautorepair.com";
const URL = `${SITE}/south-florida`;

const SouthFlorida = () => {
  useSeo({
    title: "Mobile Mechanic in Broward & Palm Beach | Mike's Mobile Auto Repair",
    description: "Mobile mechanic for Broward and Palm Beach Counties, FL. Diagnostics, brakes, batteries and repairs at your home or work. Call (813) 501-7572.",
    canonical: URL,
    // Kept out of Google until the South Florida region launches.
    noindex: !SOUTH_FLORIDA_WEBSITE_LIVE,
    breadcrumbs: [
      { name: "Home", url: `${SITE}/` },
      { name: "South Florida", url: URL },
    ],
    jsonLd: SOUTH_FLORIDA_WEBSITE_LIVE
      ? [
          {
            "@context": "https://schema.org",
            "@type": "AutoRepair",
            "@id": `${URL}#business`,
            name: "Mike's Mobile Auto Repair — South Florida",
            url: URL,
            telephone: "+18135017572",
            priceRange: "$$",
            parentOrganization: { "@id": `${SITE}/#business` },
            areaServed: [
              { "@type": "AdministrativeArea", name: "Broward County, FL" },
              { "@type": "AdministrativeArea", name: "Palm Beach County, FL" },
              ...southFloridaCities.map((c) => ({ "@type": "City", name: `${c.name}, FL` })),
            ],
            openingHoursSpecification: [{
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              opens: "08:00",
              closes: "20:00",
            }],
          },
        ]
      : undefined,
  });

  return <RegionHome region="sfl" />;
};

export default SouthFlorida;
