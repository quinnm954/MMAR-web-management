import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATE_PRESETS, dateFilterWindow, type DateFilter, type DatePreset } from '@/lib/dateFilters';

export function DateRangeFilter({ value, onChange }: { value: DateFilter; onChange: (value: DateFilter) => void }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();
  const isCustom = typeof value !== 'string';
  const openCustom = () => {
    const window = dateFilterWindow(value);
    setFrom(window.start);
    setTo(new Date(window.end.getFullYear(), window.end.getMonth(), window.end.getDate() - 1));
    setOpen(true);
  };
  const valid = from && to && from <= to;

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <Select value={isCustom ? 'custom' : value} onValueChange={(next) => next === 'custom' ? openCustom() : onChange(next as DatePreset)}>
        <SelectTrigger className="w-44 h-9 text-xs" aria-label="Date period"><SelectValue /></SelectTrigger>
        <SelectContent>
          {['To date', 'Rolling'].map(group => (
            <SelectGroup key={group}>
              <SelectLabel>{group}</SelectLabel>
              {DATE_PRESETS.filter(p => p.group === group).map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectGroup>
          ))}
          <SelectItem value="custom">Custom dates</SelectItem>
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 text-xs min-w-0" aria-label="Choose custom dates" onClick={openCustom}>
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {isCustom ? `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}` : 'Dates'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-24px)] p-3 pointer-events-auto">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Custom dates</p>
            <div className="flex flex-wrap gap-2">
              <SingleDate label="Start date" date={from} onChange={setFrom} />
              <SingleDate label="End date" date={to} onChange={setTo} />
            </div>
            {from && to && from > to && <p className="text-xs text-destructive">End date must be on or after start date.</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={!valid} onClick={() => {
                if (!from || !to || from > to) return;
                onChange({ from, to });
                setOpen(false);
              }}>Apply dates</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SingleDate({ label, date, onChange }: { label: string; date?: Date; onChange: (date?: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-xs h-9" aria-label={label}>
            <CalendarIcon className="h-4 w-4" />{date ? format(date, 'MMM d, yyyy') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0 pointer-events-auto">
          <Calendar mode="single" selected={date} defaultMonth={date} onSelect={next => { onChange(next); if (next) setOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}