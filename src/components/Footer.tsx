import mmarLogo from "@/assets/mmar-logo.jpeg";

const Footer = () => {
  return (
    <footer className="py-6 md:py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={mmarLogo} 
              alt="MMAR Logo" 
              className="h-8 md:h-10 w-auto rounded"
            />
          </div>

          <p className="text-xs md:text-sm text-muted-foreground text-center order-3 md:order-2">
            © {new Date().getFullYear()} Capital Services Management, INC. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground order-2 md:order-3">
            <span>Southwest Florida</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
