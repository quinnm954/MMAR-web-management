import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Pause, Play, BarChart3 } from 'lucide-react';

const DAYS = 365;
const BLUE = new THREE.Color('hsl(200, 80%, 60%)');
const GOLD = new THREE.Color('hsl(45, 90%, 55%)');
const DIM = new THREE.Color('hsl(215, 30%, 22%)');

// Day i (0 = a year ago, 364 = today) wound into a spiral: one turn per ~month, widening outward
const spiralPos = (i: number): [number, number] => {
  const a = (i / 30.4) * Math.PI * 2;
  const r = 2.2 + i * 0.03;
  return [Math.cos(a) * r, Math.sin(a) * r];
};

type Day = { date: Date; revenue: number; count: number };

function useSpiralData() {
  const [days, setDays] = useState<Day[]>([]);
  const [stats, setStats] = useState({ month: 0, goal: null as number | null, owed: 0, openEst: 0, openEstValue: 0 });
  const [ripple, setRipple] = useState(0);
  const known = useRef<Set<string> | null>(null);

  const load = async () => {
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const start = new Date(today0.getTime() - (DAYS - 1) * 86400000);
    const [paid, open, est, shop] = await Promise.all([
      supabase.from('invoices').select('id,total,paid_at').eq('status', 'paid').gte('paid_at', start.toISOString()),
      supabase.from('invoices').select('total,amount_paid').in('status', ['sent', 'unpaid', 'overdue', 'partial', 'partially_paid', 'viewed']),
      supabase.from('estimates').select('total').in('status', ['sent', 'draft']),
      supabase.from('shop_settings').select('monthly_revenue_goal').limit(1).maybeSingle(),
    ]);
    const rows = (paid.data ?? []) as any[];
    const arr: Day[] = Array.from({ length: DAYS }, (_, i) => ({ date: new Date(start.getTime() + i * 86400000), revenue: 0, count: 0 }));
    rows.forEach((r) => {
      const d = new Date(r.paid_at); d.setHours(0, 0, 0, 0);
      const i = Math.round((d.getTime() - start.getTime()) / 86400000);
      if (i >= 0 && i < DAYS) { arr[i].revenue += Number(r.total || 0); arr[i].count += 1; }
    });
    if (known.current && rows.some((r) => !known.current!.has(r.id))) setRipple(Date.now());
    known.current = new Set(rows.map((r) => r.id));
    setDays(arr);
    const monthStart = new Date(today0.getFullYear(), today0.getMonth(), 1);
    const estRows = (est.data ?? []) as any[];
    setStats({
      month: arr.filter((d) => d.date >= monthStart).reduce((s, d) => s + d.revenue, 0),
      goal: (shop.data as any)?.monthly_revenue_goal ? Number((shop.data as any).monthly_revenue_goal) : null,
      owed: ((open.data ?? []) as any[]).reduce((s, i) => s + Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)), 0),
      openEst: estRows.length,
      openEstValue: estRows.reduce((s, e) => s + Number(e.total || 0), 0),
    });
  };

  useEffect(() => {
    load();
    let t: ReturnType<typeof setTimeout> | undefined;
    const kick = () => { clearTimeout(t); t = setTimeout(load, 600); };
    const ch = supabase.channel('time-spiral-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, kick)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estimates' }, kick)
      .subscribe();
    const iv = setInterval(kick, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { days, stats, ripple };
}

function Bars({ days, upTo, picked, onPick }: { days: Day[]; upTo: number; picked: number | null; onPick: (i: number) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const heights = useRef<Float32Array>(new Float32Array(DAYS));
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const obj = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < DAYS; i++) {
      const d = days[i];
      if (i > upTo || !d || d.revenue <= 0) col.copy(DIM);
      else col.copy(BLUE).lerp(GOLD, Math.sqrt(d.revenue / max));
      if (i === picked) col.offsetHSL(0, 0, 0.2);
      ref.current.setColorAt(i, col);
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [days, upTo, picked, max, col]);

  useFrame((_, raw) => {
    if (!ref.current) return;
    const dt = Math.min(raw, 0.05);
    for (let i = 0; i < DAYS; i++) {
      const d = days[i];
      const target = i > upTo ? 0.02 : 0.08 + (d ? (d.revenue / max) * 5 : 0);
      heights.current[i] = THREE.MathUtils.damp(heights.current[i] || 0.02, target, 6, dt);
      const [x, z] = spiralPos(i);
      const h = heights.current[i];
      obj.position.set(x, h / 2, z);
      obj.rotation.set(0, -Math.atan2(z, x), 0);
      obj.scale.set(1, h, 1);
      obj.updateMatrix();
      ref.current.setMatrixAt(i, obj.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, DAYS]} castShadow
      onClick={(e) => { e.stopPropagation(); if (e.instanceId != null) onPick(e.instanceId); }}>
      <boxGeometry args={[0.16, 1, 0.16]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.08} metalness={0.3} roughness={0.4} />
    </instancedMesh>
  );
}

function Orb({ position, color, fill, label, value }: { position: [number, number, number]; color: THREE.Color; fill: number; label: string; value: string }) {
  const ref = useRef<THREE.Group>(null);
  const seed = position[0];
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime + seed) * 0.25;
  });
  const f = Math.max(0, Math.min(1, fill));
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhysicalMaterial color={color} transparent opacity={0.22} roughness={0.1} transmission={0.4} />
      </mesh>
      {f > 0 && (
        <mesh position={[0, -0.9 + 0.9 * f, 0]} scale={[f * 0.85 + 0.1, f * 0.85 + 0.1, f * 0.85 + 0.1]}>
          <sphereGeometry args={[0.9, 24, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
        </mesh>
      )}
      <Html position={[0, -1.35, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-0.5 text-center">
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="text-xs font-medium text-foreground">{value}</div>
        </div>
      </Html>
    </group>
  );
}

function Ripple({ at }: { at: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const [x, z] = spiralPos(DAYS - 1);
  useFrame(() => {
    if (!ref.current) return;
    const k = (Date.now() - at) / 2500;
    ref.current.visible = k < 1;
    ref.current.scale.setScalar(0.3 + k * 5);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k);
  });
  return (
    <mesh ref={ref} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1, 48]} />
      <meshBasicMaterial color={GOLD} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function TimeSpiral3D({ onOpenReports }: { onOpenReports?: () => void }) {
  const { days, stats, ripple } = useSpiralData();
  const [upTo, setUpTo] = useState(DAYS - 1);
  const [playing, setPlaying] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setUpTo((u) => { if (u >= DAYS - 1) { setPlaying(false); return DAYS - 1; } return Math.min(DAYS - 1, u + 3); }), 40);
    return () => clearInterval(iv);
  }, [playing]);

  const money = (n: number) => '$' + Math.round(n).toLocaleString();
  const running = days.slice(0, upTo + 1).reduce((s, d) => s + d.revenue, 0);
  const curDate = days[upTo]?.date;
  const pd = picked != null ? days[picked] : null;
  const goalFill = stats.goal ? stats.month / stats.goal : 0;

  return (
    <div className="relative h-[calc(100dvh-9rem)] min-h-[520px] w-full overflow-hidden rounded-xl border border-border bg-background">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 16, typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : 19], fov: 45 }}>
        <color attach="background" args={['#07111f']} />
        <fog attach="fog" args={['#07111f', 26, 55]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 16, 8]} intensity={1.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 3, 0]} intensity={20} color={GOLD} distance={10} />
        <Suspense fallback={null}>
          <Environment resolution={64}>
            <Lightformer intensity={2} position={[0, 8, 0]} scale={[12, 12, 1]} />
            <Lightformer intensity={1} color="#5fb8f0" position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          </Environment>
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[30, 64]} />
          <meshStandardMaterial color="#0a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
        <gridHelper args={[60, 60, '#123a5c', '#0c2238']} position={[0, 0.01, 0]} />
        {days.length > 0 && <Bars days={days} upTo={upTo} picked={picked} onPick={setPicked} />}
        <Orb position={[-8, 3, -7]} color={BLUE} fill={1} label="This month" value={money(stats.month)} />
        <Orb position={[8, 3, -7]} color={GOLD} fill={goalFill} label="Goal" value={stats.goal ? `${Math.round(goalFill * 100)}% of ${money(stats.goal)}` : 'Not set'} />
        <Orb position={[-7, 3.5, 4]} color={new THREE.Color('hsl(0, 70%, 60%)')} fill={stats.owed > 0 ? 0.6 : 0} label="Money owed" value={money(stats.owed)} />
        <Orb position={[7, 3.5, 4]} color={new THREE.Color('hsl(160, 60%, 50%)')} fill={stats.openEst > 0 ? 0.5 : 0} label="Open estimates" value={`${stats.openEst} · ${money(stats.openEstValue)}`} />
        {ripple > 0 && <Ripple key={ripple} at={ripple} />}
        <OrbitControls enablePan={false} minDistance={7} maxDistance={40} maxPolarAngle={Math.PI / 2.1} autoRotate={!playing && picked == null} autoRotateSpeed={0.4} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto rounded-xl border border-border bg-card/85 px-4 py-2 backdrop-blur">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Past 12 months</p>
          <p className="font-display text-2xl text-foreground">{money(running)}</p>
          <p className="text-xs text-muted-foreground">Each bar is one day · taller and more gold = more sales</p>
        </div>
        <Button size="sm" variant="secondary" className="pointer-events-auto" onClick={onOpenReports}>
          <BarChart3 className="mr-2 h-4 w-4" /> Full report
        </Button>
      </div>

      {pd && (
        <div className="absolute left-3 top-32 max-w-[240px] rounded-xl border border-border bg-card/90 p-3 text-sm backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground">{pd.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <button className="text-muted-foreground" onClick={() => setPicked(null)} aria-label="Close">×</button>
          </div>
          <p className="text-xs text-muted-foreground">{money(pd.revenue)} from {pd.count} paid invoice{pd.count === 1 ? '' : 's'}</p>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-border bg-card/85 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => { if (!playing && upTo >= DAYS - 1) setUpTo(0); setPicked(null); setPlaying((p) => !p); }}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <Slider value={[upTo]} min={0} max={DAYS - 1} step={1} onValueChange={(v) => { setPlaying(false); setUpTo(v[0]); }} />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{curDate ? `Through ${curDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</span>
              <span>{money(running)} so far</span>
            </div>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Press play to replay your year · drag to spin · tap a bar</p>
      </div>
    </div>
  );
}
