import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// World scrolls toward the camera (+z). Camera sits in the driver's seat looking down -z.
const LENGTH = 240;          // recycled stretch of street
const BLUE = new THREE.Color('hsl(200, 80%, 60%)');
const GOLD = new THREE.Color('hsl(45, 90%, 55%)');
const speedAt = (t: number) => 38 + Math.sin(t * 0.18) * 14 + Math.sin(t * 0.07) * 6; // m/s, builds and eases
const wrap = (z: number) => (z > 8 ? z - LENGTH : z);

function windowTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#05070c'; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) {
    if (Math.random() < 0.45) { g.fillStyle = Math.random() < 0.7 ? '#ffd27a' : '#9fd4ff'; g.globalAlpha = 0.4 + Math.random() * 0.6; g.fillRect(x, y, 6, 6); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  return t;
}

function gaugeTexture(label: string) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#05060a'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d33'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 56, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
  g.strokeStyle = '#ddd'; g.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    g.beginPath(); g.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); g.stroke();
  }
  g.fillStyle = '#aaa'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText(label, 64, 96);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Street ----
function Road() {
  const lines = useRef<THREE.InstancedMesh>(null);
  const N = 40;
  const z = useRef(Array.from({ length: N }, (_, i) => -i * (LENGTH / N)));
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime);
    for (let i = 0; i < N; i++) {
      z.current[i] = wrap(z.current[i] + v * dt);
      o.position.set(0, 0.01, z.current[i]); o.updateMatrix(); lines.current!.setMatrixAt(i, o.matrix);
    }
    lines.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -LENGTH / 2]}>
        <planeGeometry args={[14, LENGTH + 20]} />
        <meshStandardMaterial color="#0c0e13" roughness={0.25} metalness={0.6} />
      </mesh>
      {/* sidewalks */}
      {[-9, 9].map((x) => (
        <mesh key={x} position={[x, 0.08, -LENGTH / 2]}>
          <boxGeometry args={[4, 0.16, LENGTH + 20]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={lines} args={[undefined, undefined, N]}>
        <boxGeometry args={[0.18, 0.01, 2.4]} />
        <meshBasicMaterial color="#e8e2c8" toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Buildings() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 70;
  const tex = useMemo(() => { const t = windowTexture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); return t; }, []);
  const data = useMemo(() => Array.from({ length: N }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const w = 6 + Math.random() * 6, h = 8 + Math.random() * 28, d = 6 + Math.random() * 6;
    return { x: side * (11 + w / 2 + Math.random() * 2), z: -Math.floor(i / 2) * (LENGTH / (N / 2)) - Math.random() * 3, w, h, d };
  }), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime);
    data.forEach((b, i) => {
      b.z = wrap(b.z + v * dt);
      o.position.set(b.x, b.h / 2, b.z); o.scale.set(b.w, b.h, b.d); o.updateMatrix(); ref.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <boxGeometry />
      <meshStandardMaterial color="#0b0d14" emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.1} roughness={0.8} />
    </instancedMesh>
  );
}

function StreetLights() {
  const poles = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const pools = useRef<THREE.InstancedMesh>(null);
  const N = 24;
  const z = useRef(Array.from({ length: N }, (_, i) => -Math.floor(i / 2) * (LENGTH / (N / 2))));
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime);
    for (let i = 0; i < N; i++) {
      z.current[i] = wrap(z.current[i] + v * dt);
      const x = i % 2 ? 7.6 : -7.6;
      o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0);
      o.position.set(x, 3.5, z.current[i]); o.updateMatrix(); poles.current!.setMatrixAt(i, o.matrix);
      o.position.set(x * 0.85, 7, z.current[i]); o.updateMatrix(); heads.current!.setMatrixAt(i, o.matrix);
      o.position.set(x * 0.7, 0.02, z.current[i]); o.rotation.set(-Math.PI / 2, 0, 0); o.updateMatrix(); pools.current!.setMatrixAt(i, o.matrix);
    }
    poles.current!.instanceMatrix.needsUpdate = true; heads.current!.instanceMatrix.needsUpdate = true; pools.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={poles} args={[undefined, undefined, N]}>
        <cylinderGeometry args={[0.08, 0.1, 7, 6]} />
        <meshStandardMaterial color="#2a2d33" />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, N]}>
        <boxGeometry args={[1.4, 0.15, 0.4]} />
        <meshBasicMaterial color="#ffe2a8" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, N]}>
        <circleGeometry args={[3.2, 24]} />
        <meshBasicMaterial color="#ffcf85" transparent opacity={0.13} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

function NeonSigns() {
  const group = useRef<THREE.Group>(null);
  const signs = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * 10.6, y: 4 + Math.random() * 6, z: -i * (LENGTH / 10) - 10,
    w: 2 + Math.random() * 3, color: i % 3 === 0 ? GOLD : i % 3 === 1 ? BLUE : new THREE.Color('hsl(340, 85%, 60%)'),
  })), []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime);
    group.current!.children.forEach((m, i) => { signs[i].z = wrap(signs[i].z + v * dt); m.position.z = signs[i].z; });
  });
  return (
    <group ref={group}>
      {signs.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, s.x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[s.w, 0.7]} />
          <meshBasicMaterial color={s.color} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Traffic() {
  const group = useRef<THREE.Group>(null);
  const cars = useMemo(() => [
    { x: -2.2, z: -60, v: 24 }, { x: 2.2, z: -120, v: 20 }, { x: -2.2, z: -190, v: 28 },
  ], []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime);
    group.current!.children.forEach((g, i) => {
      const c = cars[i];
      c.z += (v - c.v) * dt;
      if (c.z > 8) { c.z = -LENGTH + Math.random() * 30; c.x = Math.random() < 0.5 ? -2.2 : 2.2; }
      g.position.set(c.x, 0, c.z);
    });
  });
  return (
    <group ref={group}>
      {cars.map((_, i) => (
        <group key={i}>
          <mesh position={[0, 0.65, 0]}><boxGeometry args={[1.9, 0.9, 4.2]} /><meshStandardMaterial color="#15171c" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, 1.25, 0.3]}><boxGeometry args={[1.6, 0.5, 2]} /><meshStandardMaterial color="#0d0f13" /></mesh>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 0.8, 2.11]}><boxGeometry args={[0.4, 0.14, 0.02]} /><meshBasicMaterial color="#ff2a2a" toneMapped={false} /></mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ---- Cockpit (fixed to the camera) ----
function Cockpit() {
  const { camera, scene } = useThree();
  const rig = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const speedNeedle = useRef<THREE.Mesh>(null);
  const tachNeedle = useRef<THREE.Mesh>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const speedTex = useMemo(() => gaugeTexture('MPH'), []);
  const tachTex = useMemo(() => gaugeTexture('RPM x1000'), []);

  useLayoutEffect(() => {
    scene.add(camera);
    if (rig.current) camera.add(rig.current);
    return () => { if (rig.current) camera.remove(rig.current); scene.remove(camera); };
  }, [camera, scene]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime, v = speedAt(t);
    const steer = Math.sin(t * 0.35) * 0.5 + Math.sin(t * 0.9) * 0.12;
    camera.position.set(Math.sin(t * 0.35) * 0.6, 1.15 + Math.sin(t * 7) * 0.006, 0);
    camera.rotation.set(-0.03, -steer * 0.08, -steer * 0.025);
    if (wheel.current) wheel.current.rotation.z = -steer * 1.4;
    const vn = (v - 18) / 44;
    if (speedNeedle.current) speedNeedle.current.rotation.z = Math.PI * 0.75 - vn * Math.PI * 1.5 + Math.PI;
    const rpm = (((t * 0.25) % 1) * 0.6 + 0.3);
    if (tachNeedle.current) tachNeedle.current.rotation.z = Math.PI * 0.75 - rpm * Math.PI * 1.5 + Math.PI;
    if (sweep.current) sweep.current.intensity = 0.15 + Math.max(0, Math.sin(t * v * 0.13)) * 0.6;
  });

  const needle = (ref: React.RefObject<THREE.Mesh>) => (
    <mesh ref={ref} position={[0, 0, 0.002]}>
      <planeGeometry args={[0.004, 0.05]} />
      <meshBasicMaterial color="#ff3b30" toneMapped={false} />
    </mesh>
  );

  return (
    <group ref={rig}>
      <pointLight ref={sweep} position={[0, 0.3, -0.6]} color="#ffd9a0" distance={2} intensity={3} />
      {/* hood with twin stripes */}
      <mesh position={[0, -0.42, -1.6]} rotation={[-Math.PI / 2 + 0.08, 0, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial color="#0a0b0e" metalness={0.9} roughness={0.2} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, -0.415, -1.6]} rotation={[-Math.PI / 2 + 0.08, 0, 0]}>
          <planeGeometry args={[0.14, 2.2]} />
          <meshStandardMaterial color="#e9eef5" metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
      {/* dashboard */}
      <mesh position={[0, -0.33, -0.55]}>
        <boxGeometry args={[2.4, 0.16, 0.5]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} />
      </mesh>
      {/* gauge cluster */}
      <group position={[0, -0.235, -0.5]} rotation={[-0.2, 0, 0]}>
        <mesh position={[-0.07, 0, 0]}><circleGeometry args={[0.05, 32]} /><meshBasicMaterial map={speedTex} toneMapped={false} /></mesh>
        <mesh position={[0.07, 0, 0]}><circleGeometry args={[0.05, 32]} /><meshBasicMaterial map={tachTex} toneMapped={false} /></mesh>
        <group position={[-0.07, 0, 0]}><group position={[0, 0, 0]}>{needle(speedNeedle as any)}</group></group>
        <group position={[0.07, 0, 0]}>{needle(tachNeedle as any)}</group>
      </group>
      {/* steering wheel */}
      <group ref={wheel} position={[0, -0.27, -0.38]} rotation={[0.35, 0, 0]}>
        <mesh><torusGeometry args={[0.15, 0.017, 12, 48]} /><meshStandardMaterial color="#111114" roughness={0.6} /></mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
          <mesh key={a} rotation={[0, 0, a + Math.PI / 2]} position={[Math.cos(a - Math.PI / 2) * 0.075, Math.sin(a - Math.PI / 2) * 0.075, 0]}>
            <boxGeometry args={[0.15, 0.02, 0.01]} /><meshStandardMaterial color="#1a1a1e" />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.01]}><circleGeometry args={[0.04, 32]} /><meshStandardMaterial color="#1c1c20" metalness={0.6} /></mesh>
        <mesh position={[0, 0, 0.012]}><circleGeometry args={[0.02, 3]} /><meshBasicMaterial color="#c9302c" toneMapped={false} /></mesh>
      </group>
      {/* A-pillars and roof edge */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.62, 0.05, -0.55]} rotation={[0.5, 0, s * -0.55]}>
          <boxGeometry args={[0.08, 0.95, 0.06]} />
          <meshStandardMaterial color="#060607" />
        </mesh>
      ))}
      <mesh position={[0, 0.42, -0.4]}><boxGeometry args={[2, 0.12, 0.4]} /><meshStandardMaterial color="#060607" /></mesh>
    </group>
  );
}

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function StreetRun3D({ name = 'Mike' }: { name?: string }) {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  return (
    <div className="relative h-[calc(100dvh-9rem)] min-h-[520px] w-full overflow-hidden rounded-xl border border-border bg-background">
      <Canvas dpr={[1, 1.75]} camera={{ fov: narrow ? 78 : 62, near: 0.05, far: 260, position: [0, 1.15, 0] }}>
        <color attach="background" args={['#05070d']} />
        <fog attach="fog" args={['#070a14', 30, 200]} />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#3a4a7a', '#0a0a0a', 0.6]} />
        <directionalLight position={[0, 20, -40]} intensity={0.5} color="#8fb8ff" />
        <Road />
        <Buildings />
        <StreetLights />
        <NeonSigns />
        <Traffic />
        <Cockpit />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4">
        <p className="font-display text-2xl sm:text-3xl text-foreground drop-shadow">{greeting()}, {name}</p>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
    </div>
  );
}
