import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  table: string;
  id: string;
  label?: string;
  description?: string;
  onDeleted?: () => void;
  size?: "sm" | "icon";
}

const DeleteButton = ({ table, id, label = "Delete", description, onDeleted, size = "sm" }: Props) => {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setOpen(false);
    onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {size === "icon" ? (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title={label}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-8 text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> {label}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this record?</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={busy} className="bg-destructive hover:bg-destructive/90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteButton;
