import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

interface Props {
  to?: string;
  className?: string;
  label?: string;
  variant?: "icon" | "nav";
}

const MessagesBellLink = ({ to = "/messages", className, label = "Messages", variant = "icon" }: Props) => {
  const { count } = useUnreadMessages();
  if (variant === "nav") {
    return (
      <Link to={to} className={cn("relative flex items-center gap-2", className)} aria-label={`${label}${count ? `, ${count} unread` : ""}`}>
        <span className="relative">
          <MessageCircle className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <Link
      to={to}
      aria-label={`${label}${count ? `, ${count} unread` : ""}`}
      className={cn(
        "relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted tap-44",
        className,
      )}
    >
      <MessageCircle className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
};

export default MessagesBellLink;
