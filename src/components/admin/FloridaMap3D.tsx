import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Pause, Play, BarChart3 } from 'lucide-react';

// ---- Geography (simplified Southwest Florida) ----
const LON0 = -81.7, LAT0 = 26.35, SCALE = 22;
const toXZ = (lon: number, lat: number): [number, number] => [(lon - LON0) * SCALE, -(lat - LAT0) * SCALE];

const MAINLAND: [number, number][] = [
  [-82.1, 26.98], [-82.07, 26.85], [-82.02, 26.72], [-82.0, 26.62], [-81.97, 26.53], [-81.93, 26.47],
  [-81.88, 26.43], [-81.85, 26.36], [-81.83, 26.29], [-81.82, 26.2], [-81.8, 26.1], [-81.76, 26.0],
  [-81.7, 25.9], [-81.55, 25.84], [-81.2, 25.8], [-81.15, 26.98],
];
const PINE_ISLAND: [number, number][] = [[-82.13, 26.72], [-82.08, 26.72], [-82.06, 26.56], [-82.1, 26.52], [-82.14, 26.6]];
const SANIBEL: [number, number][] = [[-82.2, 26.46], [-82.02, 26.44], [-82.0, 26.47], [-82.18, 26.5]];

type Town = { name: string; lon: number; lat: number; match: string[] };
const TOWNS: Town[] = [
  { name: 'North Fort Myers', lon: -81.88, lat: 26.68, match: ['north fort myers', 'n fort myers', 'n. fort myers'] },
  { name: 'Fort Myers Beach', lon: -81.95, lat: 26.45, match: ['fort myers beach'] },
  { name: 'Fort Myers', lon: -81.84, lat: 26.62, match: ['fort myers', 'ft myers', 'ft. myers'] },
  { name: 'Cape Coral', lon: -81.96, lat: 26.58, match: ['cape coral'] },
  { name: 'Lehigh Acres', lon: -81.62, lat: 26.61, match: ['lehigh'] },
  { name: 'San Carlos Park', lon: -81.8, lat: 26.48, match: ['san carlos'] },
  { name: 'Estero', lon: -81.79, lat: 26.43, match: ['estero'] },
  { name: 'Bonita Springs', lon: -81.78, lat: 26.34, match: ['bonita'] },
  { name: 'Naples', lon: -81.77, lat: 26.15, match: ['naples'] },
  { name: 'Marco Island', lon: -81.71, lat: 25.95, match: ['marco'] },
  { name: 'Immokalee', lon: -81.42, lat: 26.42, match: ['immokalee'] },
];
const townFor = (text?: string | null) => {
  const t = (text || '').toLowerCase();
  if (!t) return null;
  return TOWNS.find((tw) => tw.match.some((m) => t.includes(m)))?.name ?? null;
};

const BLUE = new THREE.Color('hsl(200, 80%, 60%)');
const GOLD = new THREE.Color('hsl(45, 90%, 55%)');

// ---- Data ----
type Paid = { id: string; total: number; paid_at: string; town: string | null };
type Job = { id: string; town: string | null; status: string; time: string; customer: string; car: string; service: string };

function useMapData() {
  const [paid, setPaid] = useState<Paid[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [goal, setGoal] = useState<number | null>(null);
  const [todo, setTodo] = useState(0);
  const [ripple, setRipple] = useState<{ town: string; at: number } | null>(null);
  const known = useRef<Set<string> | null>(null);

  const load = async () => {
    const since = new Date(); since.setFullYear(since.getFullYear() - 1);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86400000);
    const [inv, today, shop, drafts, reqs] = await Promise.all([
      supabase.from('invoices').select('id,total,paid_at,customer_id,appointment_id').eq('status', 'paid').gte('paid_at', since.toISOString()),
      supabase.from('appointments').select('id,status,scheduled_at,service_type,service_address,customer_id,vehicle_id').gte('scheduled_at', start.toISOString()).lt('scheduled_at', end.toISOString()).neq('status', 'cancelled'),
      supabase.from('shop_settings').select('monthly_revenue_goal').limit(1).maybeSingle(),
      supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('booking_requests' as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    const invs = (inv.data ?? []) as any[];
    const ap = (today.data ?? []) as any[];
    const apptIds = Array.from(new Set(invs.map((i) => i.appointment_id).filter(Boolean)));
    const custIds = Array.from(new Set([...invs, ...ap].map((i) => i.customer_id).filter(Boolean)));
    const vehIds = Array.from(new Set(ap.map((a) => a.vehicle_id).filter(Boolean)));
    const [aRes, pRes, vRes] = await Promise.all([
      apptIds.length ? supabase.from('appointments').select('id,service_address').in('id', apptIds) : Promise.resolve({ data: [] as any[] }),
      custIds.length ? supabase.from('profiles').select('id,full_name,city,address_line1').in('id', custIds) : Promise.resolve({ data: [] as any[] }),
      vehIds.length ? supabase.from('vehicles').select('id,year,make,model').in('id', vehIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const addr = new Map((aRes.data ?? []).map((a: any) => [a.id, a.service_address]));
    const prof = new Map((pRes.data ?? []).map((p: any) => [p.id, p]));
    const veh = new Map((vRes.data ?? []).map((v: any) => [v.id, `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim()]));
    const custTown = (id: string) => { const p: any = prof.get(id); return p ? townFor(`${p.city ?? ''} ${p.address_line1 ?? ''}`) : null; };
    const rows: Paid[] = invs.map((i) => ({
      id: i.id, total: Number(i.total || 0), paid_at: i.paid_at,
      town: townFor(addr.get(i.appointment_id) as string) ?? custTown(i.customer_id),
    }));
    if (known.current) {
      const fresh = rows.find((r) => !known.current!.has(r.id));
      if (fresh?.town) setRipple({ town: fresh.town, at: Date.now() });
    }
    known.current = new Set(rows.map((r) => r.id));
    setPaid(rows);
    setJobs(ap.map((a) => {
      const p: any = prof.get(a.customer_id);
      return {
        id: a.id, status: a.status, service: a.service_type || 'Job',
        town: townFor(a.service_address) ?? custTown(a.customer_id),
        time: new Date(a.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
        customer: p?.full_name || 'Customer', car: (veh.get(a.vehicle_id) as string) || '',
      };
    }));
    setGoal((shop.data as any)?.monthly_revenue_goal ? Number((shop.data as any).monthly_revenue_goal) : null);
    setTodo((drafts.count ?? 0) + (reqs.count ?? 0));
  };

  useEffect(() => {
    load();
    let t: ReturnType<typeof setTimeout> | undefined;
    const kick = () => { clearTimeout(t); t = setTimeout(load, 600); };
    const ch = supabase.channel('florida-map-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, kick)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, kick)
      .subscribe();
    const iv = setInterval(kick, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { paid, jobs, goal, todo, ripple };
}

// ---- 3D pieces ----
function Land({ pts, height = 0.35 }: { pts: [number, number][]; height?: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    pts.forEach(([lon, lat], i) => { const [x, z] = toXZ(lon, lat); i ? s.lineTo(x, -z) : s.moveTo(x, -z); });
    const g = new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [pts, height]);
  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial color="#1f3a2e" roughness={0.85} />
    </mesh>
  );
}

function Tower({ town, value, max, onPick, picked }: { town: Town; value: number; max: number; onPick: () => void; picked: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const target = max > 0 ? 0.15 + (value / max) * 6 : 0.15;
  const [x, z] = toXZ(town.lon, town.lat);
  const color = useMemo(() => BLUE.clone().lerp(GOLD, max > 0 ? value / max : 0), [value, max]);
  useFrame((_, d) => {
    if (!ref.current) return;
    const h = THREE.MathUtils.damp(ref.current.scale.y, target, 4, Math.min(d, 0.05));
    ref.current.scale.y = h;
    ref.current.position.y = 0.45 + h / 2;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} scale={[1, 0.15, 1]} castShadow onClick={(e) => { e.stopPropagation(); onPick(); }}>
        <cylinderGeometry args={[0.28, 0.34, 1, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={picked ? 1.2 : 0.55} metalness={0.3} roughness={0.35} />
      </mesh>
      <Html position={[0, target + 1.1, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded-md bg-background/80 px-2 py-0.5 text-[11px] text-foreground border border-border">
          {town.name}{value > 0 ? ` · $${Math.round(value).toLocaleString()}` : ''}
        </div>
      </Html>
    </group>
  );
}

function JobPin({ job, index, onPick }: { job: Job; index: number; onPick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const town = TOWNS.find((t) => t.name === job.town);
  const [x, z] = town ? toXZ(town.lon, town.lat) : toXZ(-81.3, 26.85);
  const off = (index % 4) * 0.55 - 0.8;
  const col = job.status === 'completed' ? '#4ade80' : job.status === 'in_progress' ? GOLD : BLUE;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 2 + index) * 0.2;
    const s = 1 + Math.sin(clock.elapsedTime * 3 + index) * 0.12;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref} position={[x + off, 1.4, z + 0.7]} onClick={(e) => { e.stopPropagation(); onPick(); }}>
      <mesh rotation={[Math.PI, 0, 0]} position={[0, -0.25, 0]}>
        <coneGeometry args={[0.18, 0.5, 16]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Ripple({ town, at }: { town: string; at: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = TOWNS.find((x) => x.name === town);
  useFrame(() => {
    if (!ref.current) return;
    const k = (Date.now() - at) / 2500;
    ref.current.visible = k < 1;
    ref.current.scale.setScalar(0.5 + k * 6);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k);
  });
  if (!t) return null;
  const [x, z] = toXZ(t.lon, t.lat);
  return (
    <mesh ref={ref} position={[x, 0.5, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1, 48]} />
      <meshBasicMaterial color={GOLD} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// ---- Main ----
export default function FloridaMap3D({ onOpenReports }: { onOpenReports?: () => void }) {
  const { paid, jobs, goal, todo, ripple } = useMapData();
  const WEEKS = 52;
  const [week, setWeek] = useState(WEEKS);
  const [playing, setPlaying] = useState(false);
  const [picked, setPicked] = useState<{ title: string; lines: string[] } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setWeek((w) => { if (w >= WEEKS) { setPlaying(false); return WEEKS; } return w + 1; }), 180);
    return () => clearInterval(iv);
  }, [playing]);

  const cutoff = useMemo(() => Date.now() - (WEEKS - week) * 7 * 86400000, [week]);
  const byTown = useMemo(() => {
    const m = new Map<string, number>();
    paid.forEach((p) => { if (new Date(p.paid_at).getTime() <= cutoff) { const k = p.town ?? 'Other'; m.set(k, (m.get(k) ?? 0) + p.total); } });
    return m;
  }, [paid, cutoff]);
  const max = Math.max(0, ...TOWNS.map((t) => byTown.get(t.name) ?? 0));
  const shownTotal = Array.from(byTown.values()).reduce((a, b) => a + b, 0);
  const other = byTown.get('Other') ?? 0;

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthRev = paid.filter((p) => new Date(p.paid_at) >= monthStart).reduce((s, p) => s + p.total, 0);
  const goalPct = goal ? Math.min(100, (monthRev / goal) * 100) : null;
  const weekLabel = new Date(cutoff).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const money = (n: number) => '$' + Math.round(n).toLocaleString();

  return (
    <div className="relative h-[calc(100dvh-9rem)] min-h-[520px] w-full overflow-hidden rounded-xl border border-border bg-background">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [3, 12, 13], fov: 45 }}>
        <color attach="background" args={['#07111f']} />
        <fog attach="fog" args={['#07111f', 28, 60]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[8, 18, 6]} intensity={1.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <Suspense fallback={null}>
          <Environment resolution={64}>
            <Lightformer intensity={2} position={[0, 8, 0]} scale={[12, 12, 1]} />
            <Lightformer intensity={1} color="#5fb8f0" position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          </Environment>
        </Suspense>
        {/* Gulf */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[40, 64]} />
          <meshStandardMaterial color="#0b2a44" metalness={0.6} roughness={0.25} />
        </mesh>
        <gridHelper args={[80, 80, '#123a5c', '#0d2b45']} position={[0, 0.01, 0]} />
        <Land pts={MAINLAND} />
        <Land pts={PINE_ISLAND} height={0.2} />
        <Land pts={SANIBEL} height={0.15} />
        {TOWNS.map((t) => (
          <Tower key={t.name} town={t} value={byTown.get(t.name) ?? 0} max={max} picked={picked?.title === t.name}
            onPick={() => setPicked({ title: t.name, lines: [`Earned through ${weekLabel}: ${money(byTown.get(t.name) ?? 0)}`, `Jobs today: ${jobs.filter((j) => j.town === t.name).length}`] })} />
        ))}
        {jobs.map((j, i) => (
          <JobPin key={j.id} job={j} index={i}
            onPick={() => setPicked({ title: j.service, lines: [j.customer, j.car, `${j.time} · ${j.status.replace('_', ' ')}`, j.town ?? 'Town unknown'].filter(Boolean) })} />
        ))}
        {ripple && <Ripple key={ripple.at} town={ripple.town} at={ripple.at} />}
        <OrbitControls enablePan={false} minDistance={8} maxDistance={40} maxPolarAngle={Math.PI / 2.2} target={[0, 0, 0]} />
      </Canvas>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto rounded-xl border border-border bg-card/85 px-4 py-2 backdrop-blur">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">This month</p>
          <p className="font-display text-2xl text-foreground">{money(monthRev)}</p>
          {goalPct != null && (
            <div className="mt-1 h-1.5 w-40 rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${goalPct}%` }} />
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{jobs.length} job{jobs.length === 1 ? '' : 's'} today · {todo} to-do</p>
        </div>
        <Button size="sm" variant="secondary" className="pointer-events-auto" onClick={onOpenReports}>
          <BarChart3 className="mr-2 h-4 w-4" /> Full report
        </Button>
      </div>

      {picked && (
        <div className="absolute left-3 top-32 max-w-[240px] rounded-xl border border-border bg-card/90 p-3 text-sm backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground">{picked.title}</p>
            <button className="text-muted-foreground" onClick={() => setPicked(null)} aria-label="Close">×</button>
          </div>
          {picked.lines.map((l) => <p key={l} className="text-xs text-muted-foreground">{l}</p>)}
        </div>
      )}

      {/* Time slider */}
      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-border bg-card/85 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" onClick={() => { if (!playing && week >= WEEKS) setWeek(0); setPlaying((p) => !p); }} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <Slider value={[week]} min={0} max={WEEKS} step={1} onValueChange={(v) => { setPlaying(false); setWeek(v[0]); }} />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Through {weekLabel}</span>
              <span>{money(shownTotal)} earned{other > 0 ? ` · ${money(other)} other areas` : ''}</span>
            </div>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Drag to spin · pinch to zoom · tap a tower or pin</p>
      </div>
    </div>
  );
}
