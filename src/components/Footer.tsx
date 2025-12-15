import mmarLogo from "@/assets/mmar-logo.jpeg";

const Footer = () => {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={mmarLogo} 
              alt="MMAR Logo" 
              className="h-10 w-auto rounded"
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Mike's Mobile Auto Repair LLC. All rights
            reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Greenville & Spartanburg County, SC</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
