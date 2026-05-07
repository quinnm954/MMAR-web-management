import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DecodedVin {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
}

export default function VinDecoder({ onApply }: { onApply: (data: DecodedVin & { vin: string }) => void }) {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);

  const decode = async () => {
    const v = vin.trim().toUpperCase();
    if (v.length < 11) return toast.error('Enter a valid VIN');
    setLoading(true);
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${v}?format=json`);
      const json = await res.json();
      const r = json?.Results?.[0];
      if (!r || r.ErrorCode?.startsWith('1')) {
        toast.error(r?.ErrorText || 'VIN could not be decoded');
        setLoading(false);
        return;
      }
      const decoded: DecodedVin & { vin: string } = {
        vin: v,
        year: r.ModelYear || undefined,
        make: r.Make || undefined,
        model: r.Model || undefined,
        trim: r.Trim || r.Series || undefined,
        engine: [r.DisplacementL && `${r.DisplacementL}L`, r.EngineCylinders && `${r.EngineCylinders}cyl`, r.FuelTypePrimary]
          .filter(Boolean).join(' ') || undefined,
      };
      onApply(decoded);
      toast.success(`Decoded ${decoded.year} ${decoded.make} ${decoded.model}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-3 flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium">Decode VIN (auto-fill year/make/model)</label>
          <Input value={vin} onChange={e => setVin(e.target.value)} placeholder="17-char VIN" maxLength={17} className="font-mono uppercase" />
        </div>
        <Button onClick={decode} disabled={loading} type="button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decode'}
        </Button>
      </CardContent>
    </Card>
  );
}
