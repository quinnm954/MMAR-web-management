import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';
import { useGLTF, Environment, Lightformer } from '@react-three/drei';

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

// ---- Real GT500 (CC-BY 4.0, Jiaxing on Sketchfab) fixed to the camera ----
// Model forward is +z; driver's eye sits at about (0.37, 1.12, 2.05) in model space.
function Cockpit() {
  const { camera, scene } = useThree();
  const rig = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const { scene: car } = useGLTF('/models/gt500.glb');
  const model = useMemo(() => {
    const m = car.clone(true);
    m.traverse((o: any) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const mat = o.material as THREE.MeshStandardMaterial;
      if (mat?.name === 'carpaint') { mat.color = new THREE.Color('#0d1b3d'); mat.metalness = 0.8; mat.roughness = 0.25; }
      if (mat?.name === 'tinted_glass') { mat.transparent = true; mat.opacity = 0.12; mat.depthWrite = false; }
    });
    return m;
  }, [car]);

  useLayoutEffect(() => {
    scene.add(camera);
    if (rig.current) camera.add(rig.current);
    return () => { if (rig.current) camera.remove(rig.current); scene.remove(camera); };
  }, [camera, scene]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime, v = speedAt(t);
    const steer = Math.sin(t * 0.35) * 0.5 + Math.sin(t * 0.9) * 0.12;
    camera.position.set(Math.sin(t * 0.35) * 0.6, 1.15 + Math.sin(t * 7) * 0.004, 0);
    camera.rotation.set(-0.02, -steer * 0.06, -steer * 0.015);
    if (sweep.current) sweep.current.intensity = 0.4 + Math.max(0, Math.sin(t * v * 0.13)) * 1.6;
  });

  return (
    <group ref={rig}>
      <pointLight ref={sweep} position={[0, 0.6, -0.6]} color="#ffd9a0" distance={3} intensity={1} />
      <pointLight position={[0, -0.2, -0.5]} color="#9fc6ff" distance={1.2} intensity={0.25} />
      <group rotation={[0, Math.PI, 0]} position={[0.37, -1.12, 2.05]}>
        <primitive object={model} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/gt500.glb');

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
        <Suspense fallback={null}>
        <Road />
        <Buildings />
        <StreetLights />
        <NeonSigns />
        <Traffic />
        <Environment resolution={128}>
          <Lightformer intensity={1.5} position={[0, 6, -10]} scale={[20, 4, 1]} color="#ffe2b0" />
          <Lightformer intensity={0.8} position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[30, 2, 1]} color="#6fa8ff" />
          <Lightformer intensity={0.8} position={[8, 2, 0]} rotation-y={-Math.PI / 2} scale={[30, 2, 1]} color="#ff7aa8" />
        </Environment>
        <Cockpit />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4">
        <p className="font-display text-2xl sm:text-3xl text-foreground drop-shadow">{greeting()}, {name}</p>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
      <a href="https://sketchfab.com/3d-models/ford-mustang-shelby-gt500-0eaa7a16796540f29461ddae05ecdeb3" target="_blank" rel="noreferrer" className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/80 hover:text-foreground">
        GT500 model by Jiaxing · CC BY 4.0
      </a>
    </div>
  );
}
