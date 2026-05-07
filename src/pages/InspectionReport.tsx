import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const InspectionReport = () => {
  const { token } = useParams();
  const [insp, setInsp] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('inspections').select('*').eq('share_token', token).maybeSingle();
      if (data) {
        const { data: it } = await supabase.from('inspection_items').select('*').eq('inspection_id', data.id).order('sort_order');
        setItems(it ?? []);
      }
      setInsp(data);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!insp) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Inspection not found</div>;

  const grouped: Record<string, any[]> = {};
  for (const it of items) (grouped[it.category] ||= []).push(it);

  const dotColor: Record<string, string> = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500', na: 'bg-muted' };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Inspection Report</CardTitle>
            {insp.mileage && <p className="text-sm text-muted-foreground">Mileage: {insp.mileage.toLocaleString()}</p>}
          </CardHeader>
        </Card>
        {Object.entries(grouped).map(([cat, list]) => (
          <Card key={cat}>
            <CardHeader><CardTitle className="text-lg">{cat}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {list.map(it => (
                <div key={it.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${dotColor[it.status]}`} />
                    <span className="flex-1">{it.item_name}</span>
                    <Badge variant="outline" className="text-xs">{it.status}</Badge>
                  </div>
                  {it.notes && <div className="text-sm text-muted-foreground mt-1 ml-7">{it.notes}</div>}
                  {it.photo_urls?.length > 0 && (
                    <div className="flex gap-2 mt-2 ml-7 flex-wrap">
                      {it.photo_urls.map((url: string, i: number) => (
                        <img key={i} src={url} className="w-24 h-24 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {insp.summary_notes && (
          <Card><CardHeader><CardTitle className="text-lg">Technician Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-wrap">{insp.summary_notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InspectionReport;
