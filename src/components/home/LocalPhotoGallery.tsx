import batteryImg from "@/assets/gallery-battery-lehigh.jpg";
import brakesImg from "@/assets/gallery-brakes-fortmyers.jpg";
import vanImg from "@/assets/gallery-van-naples.jpg";
import alternatorImg from "@/assets/gallery-alternator-cape.jpg";

type Photo = { src: string; alt: string; caption: string };

const PHOTOS: Photo[] = [
  {
    src: batteryImg,
    alt: "Mobile mechanic in Lehigh Acres FL testing a car battery in a customer's driveway",
    caption: "Battery & charging-system test — Lehigh Acres, FL",
  },
  {
    src: brakesImg,
    alt: "Mobile brake pad replacement at a customer driveway in Fort Myers FL",
    caption: "Brake pad & rotor replacement — Fort Myers, FL",
  },
  {
    src: vanImg,
    alt: "Mobile auto repair service van serving Naples FL with tools loaded",
    caption: "Mobile mechanic service van — Naples, FL",
  },
  {
    src: alternatorImg,
    alt: "Mobile mechanic replacing an alternator on a sedan in Cape Coral FL",
    caption: "Alternator replacement — Cape Coral, FL",
  },
];

const LocalPhotoGallery = () => {
  return (
    <section className="py-12 md:py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-8">
          <h2 className="font-display text-2xl md:text-3xl text-sky mb-2">
            On-Site Work Across Lehigh Acres and Fort Myers
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Real mobile auto repair jobs from driveways across Lehigh Acres, Fort Myers, Cape Coral, and Naples.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PHOTOS.map((p) => (
            <figure
              key={p.src}
              className="rounded-xl overflow-hidden border border-border/50 bg-background"
            >
              <img
                src={p.src}
                alt={p.alt}
                width={1024}
                height={768}
                loading="lazy"
                className="w-full h-48 sm:h-44 lg:h-40 object-cover"
              />
              <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocalPhotoGallery;
