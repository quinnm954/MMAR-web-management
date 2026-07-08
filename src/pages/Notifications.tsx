import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import RolePortalShell from "@/components/shell/RolePortalShell";
import { cn } from "@/lib/utils";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { items, loading, unreadCount, markRead, markAllRead, remove } = useNotifications(100);

  return (
    <RolePortalShell>
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="link" size="sm" onClick={() => navigate("/settings/notifications")}>
            Notification settings
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              You have no notifications yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <Card
                  className={cn(
                    "cursor-pointer transition-colors",
                    !n.read_at && "border-primary/40 bg-primary/5",
                  )}
                  onClick={async () => {
                    if (!n.read_at) await markRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <CardContent className="p-3 flex items-start gap-3">
                    <div
                      className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-primary"
                      style={{ opacity: n.read_at ? 0 : 1 }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold">{n.title}</div>
                        {n.category && (
                          <Badge variant="outline" className="text-[10px]">
                            {n.category.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {n.body && <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <button
                      aria-label="Delete"
                      className="p-1.5 rounded hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </RolePortalShell>
  );
};

export default NotificationsPage;
