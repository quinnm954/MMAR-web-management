import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Paperclip, Upload, Trash2, FileText, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "warranty_doc", label: "Warranty Doc" },
  { value: "customer_photo", label: "Customer Photo" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "other", label: "Other" },
];

interface Attachment {
  id: string;
  appointment_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: string;
  notes: string | null;
  created_at: string;
}

export default function ROAttachments({ appointmentId }: { appointmentId: string }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("other");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ro_attachments")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false });
    setItems((data as Attachment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (appointmentId) load(); }, [appointmentId]);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} > 20MB`); continue; }
        const path = `${appointmentId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("ro-attachments").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(upErr.message); continue; }
        const { data: u } = await supabase.auth.getUser();
        const { error: insErr } = await supabase.from("ro_attachments").insert({
          appointment_id: appointmentId,
          uploaded_by: u.user?.id,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          category,
        });
        if (insErr) { toast.error(insErr.message); continue; }
      }
      toast.success("Uploaded");
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const open = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from("ro-attachments").createSignedUrl(a.file_path, 600);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (a: Attachment) => {
    if (!confirm(`Delete ${a.file_name}?`)) return;
    await supabase.storage.from("ro-attachments").remove([a.file_path]);
    await supabase.from("ro_attachments").delete().eq("id", a.id);
    load();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Paperclip className="h-4 w-4" /> Attachments ({items.length})
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
            Upload
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-2">No attachments yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((a) => {
            const isImg = (a.mime_type || "").startsWith("image/");
            return (
              <div key={a.id} className="flex items-center gap-2 border border-border/50 rounded p-2 text-xs">
                <div className="h-8 w-8 flex items-center justify-center rounded bg-muted shrink-0">
                  {isImg ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <button onClick={() => open(a)} className="font-medium truncate block w-full text-left hover:underline">{a.file_name}</button>
                  <div className="text-muted-foreground capitalize">{a.category.replace("_", " ")} · {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => open(a)} title="Open"><Download className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(a)} title="Delete"><Trash2 className="h-3 w-3" /></Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
