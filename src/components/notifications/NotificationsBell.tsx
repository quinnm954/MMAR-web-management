import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  className?: string;
}

const NotificationsBell = ({ className }: Props) => {
  const navigate = useNavigate();
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications(20);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className={cn(
            "relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted tap-44",
            className,
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[92vw] max-w-sm p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" /> Mark all
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[60vh]">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2.5 hover:bg-muted/60 cursor-pointer",
                    !n.read_at && "bg-primary/5",
                  )}
                  onClick={async () => {
                    if (!n.read_at) await markRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div className="mt-1 h-2 w-2 rounded-full shrink-0 bg-primary" style={{ opacity: n.read_at ? 0 : 1 }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    {n.body && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <button
                    aria-label="Dismiss"
                    className="p-1 rounded hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(n.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Link
            to="/notifications"
            className="block text-center text-xs text-primary hover:underline py-1"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
