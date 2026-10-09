import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';
import { useGLTF, Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA, HueSaturation, BrightnessContrast, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

// World scrolls toward the camera (+z). Camera sits in the driver's seat looking down -z.
const LENGTH = 240;          // recycled stretch of street
const BLUE = new THREE.Color('hsl(200, 80%, 60%)');
const GOLD = new THREE.Color('hsl(45, 90%, 55%)');
const speedAt = (t: number) => 38 + Math.sin(t * 0.18) * 14 + Math.sin(t * 0.07) * 6; // m/s, builds and eases
const wrap = (z: number) => (z > 8 ? z - LENGTH : z);

function windowTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#05070c'; g.fillRect(0, 0, 256, 512);
  for (let y = 8; y < 512; y += 28) for (let x = 8; x < 256; x += 24) {
    if (Math.random() < 0.45) { g.fillStyle = Math.random() < 0.7 ? '#ffd27a' : '#9fd4ff'; g.globalAlpha = 0.4 + Math.random() * 0.6; const gr = g.createLinearGradient(x, y, x, y + 18); gr.addColorStop(0, g.fillStyle as string); gr.addColorStop(1, '#3a2a10'); g.fillStyle = gr; g.fillRect(x, y, 16, 18); }
    g.globalAlpha = 1; g.fillStyle = '#11141c'; g.fillRect(x - 2, y + 19, 20, 3);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
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
        <MeshReflectorMaterial
          resolution={512} mirror={0.75} blur={[300, 80]} mixBlur={0.9} mixStrength={6}
          depthScale={1} minDepthThreshold={0.6} maxDepthThreshold={1.2}
          color="#0a0c11" metalness={0.6} roughness={0.55}
        />
      </mesh>
      {/* sidewalks */}
      {[-9, 9].map((x) => (
        <mesh key={x} position={[x, 0.08, -LENGTH / 2]}>
          <boxGeometry args={[4, 0.16, LENGTH + 20]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={lines} args={[undefined, undefined, N]} frustumCulled={false}>
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
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color="#0b0d14" emissive="#ffffff" emissiveMap={tex} emissiveIntensity={3} roughness={0.8} />
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
      <instancedMesh ref={poles} args={[undefined, undefined, N]} frustumCulled={false}>
        <cylinderGeometry args={[0.08, 0.1, 7, 6]} />
        <meshStandardMaterial color="#2a2d33" />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[1.4, 0.15, 0.4]} />
        <meshBasicMaterial color="#ffb25a" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, N]} frustumCulled={false}>
        <circleGeometry args={[3.2, 24]} />
        <meshBasicMaterial color="#ff9a3c" transparent opacity={0.18} depthWrite={false} />
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

// ---- Unbranded muscle-car model (CC-BY 4.0, Jiaxing on Sketchfab). Model forward is +z. ----
function useCar(paint: string) {
  const { scene: car } = useGLTF('/models/gt500.glb');
  return useMemo(() => {
    const m = car.clone(true);
    m.traverse((o: any) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const src = o.material as THREE.MeshPhysicalMaterial;
      const mat = src.clone() as THREE.MeshPhysicalMaterial;
      if (mat.name === 'carpaint') {
        mat.color = new THREE.Color(paint); mat.metalness = 0.85; mat.roughness = 0.22;
        (mat as any).clearcoat = 1; (mat as any).clearcoatRoughness = 0.04; mat.envMapIntensity = 1.6;
      }
      if (mat.name === 'tinted_glass') { mat.color = new THREE.Color('#05070a'); mat.transparent = true; mat.opacity = 0.85; mat.metalness = 1; mat.roughness = 0.05; }
      if (mat.name === 'rearlight') { mat.emissive = new THREE.Color('#ff1a1a'); mat.emissiveIntensity = 6; mat.toneMapped = false; }
      if (mat.name === 'light') { mat.emissive = new THREE.Color('#e8f2ff'); mat.emissiveIntensity = 8; mat.toneMapped = false; }
      if (mat.name === 'plate' || mat.name === 'white_gloss') mat.color = new THREE.Color('#1a1a1a'); // no badges/plates
      o.material = mat;
    });
    return m;
  }, [car, paint]);
}

function HeroCar() {
  const { camera } = useThree();
  const car = useRef<THREE.Group>(null);
  const model = useCar('#ff6a00'); // signature orange
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.set(0, 0, 30); return o; }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, v = speedAt(t);
    const lane = Math.sin(t * 0.35) * 1.6 + Math.sin(t * 0.9) * 0.25;
    const yaw = Math.cos(t * 0.35) * 0.35 * 0.35;
    if (car.current) {
      car.current.position.set(lane, Math.sin(t * 9) * 0.006, -6);
      car.current.rotation.set(0, Math.PI - yaw, -yaw * 0.25);
    }
    // low chase cam, lagging the car, widening with speed
    const fov = 58 + (v - 24) * 0.35;
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    camera.position.set(lane * 0.7, 1.35 + Math.sin(t * 13) * 0.01, -0.4);
    camera.lookAt(lane * 0.9, 0.85, -14);
  });
  return (
    <group ref={car}>
      <primitive object={model} />
      <primitive object={target} />
      <spotLight target={target} position={[0, 0.7, 4.6]} angle={0.5} penumbra={0.6} intensity={60} distance={45} color="#eaf3ff" />
      <pointLight position={[0, 0.5, -0.6]} color="#ff2020" intensity={2} distance={4} />
      <pointLight position={[0, 2.5, 2]} color="#ffb070" intensity={3} distance={6} />
    </group>
  );
}

function RivalCars() {
  const group = useRef<THREE.Group>(null);
  const a = useCar('#0b3a8c'), b = useCar('#d9d9d9'), c = useCar('#141414');
  const cars = useMemo(() => [
    { m: a, x: -2.4, z: -40, v: 30 }, { m: b, x: 2.4, z: -110, v: 26 }, { m: c, x: -2.4, z: -180, v: 33 },
  ], [a, b, c]);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime);
    group.current?.children.forEach((g, i) => {
      const r = cars[i];
      r.z += (v - r.v) * dt;
      if (r.z > 6) { r.z = -LENGTH + Math.random() * 30; r.x = Math.random() < 0.5 ? -2.4 : 2.4; }
      g.position.set(r.x, 0, r.z);
    });
  });
  return (
    <group ref={group}>
      {cars.map((r, i) => <group key={i} rotation={[0, Math.PI, 0]}><primitive object={r.m} /></group>)}
    </group>
  );
}

// Speed streaks: thin glowing lines rushing past near the edges of view.
function SpeedLines() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 60;
  const pts = useMemo(() => Array.from({ length: N }, () => ({
    x: (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 6), y: 0.3 + Math.random() * 5, z: -Math.random() * 120,
  })), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), v = speedAt(clock.elapsedTime) * 2.2;
    pts.forEach((p, i) => {
      p.z += v * dt; if (p.z > 4) p.z -= 124;
      o.position.set(p.x, p.y, p.z); o.scale.set(1, 1, 1 + v * 0.08); o.updateMatrix(); ref.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.012, 0.012, 1]} />
      <meshBasicMaterial color="#ffd7a8" transparent opacity={0.35} toneMapped={false} depthWrite={false} />
    </instancedMesh>
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
      <Canvas dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: 'high-performance' }} camera={{ fov: narrow ? 70 : 58, near: 0.1, far: 260, position: [0, 1.15, 0] }}>
        <color attach="background" args={['#041014']} />
        <fog attach="fog" args={['#06181c', 25, 170]} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#2f6f78', '#140a04', 0.7]} />
        <directionalLight position={[0, 20, -40]} intensity={0.5} color="#8fb8ff" />
        <Suspense fallback={null}>
        <Road />
        <Buildings />
        <StreetLights />
        <NeonSigns />
        <RivalCars />
        <SpeedLines />
        <Environment resolution={128}>
          <Lightformer intensity={1.5} position={[0, 6, -10]} scale={[20, 4, 1]} color="#ffe2b0" />
          <Lightformer intensity={0.8} position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[30, 2, 1]} color="#6fa8ff" />
          <Lightformer intensity={1} position={[8, 2, 0]} rotation-y={-Math.PI / 2} scale={[30, 2, 1]} color="#ff8a2a" />
        </Environment>
        <HeroCar />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.8} luminanceThreshold={0.55} luminanceSmoothing={0.25} radius={0.8} />
          <HueSaturation saturation={0.15} />
          <BrightnessContrast brightness={0.02} contrast={0.18} />
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4">
        <p className="font-display text-2xl sm:text-3xl text-foreground drop-shadow">{greeting()}, {name}</p>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
      <a href="https://sketchfab.com/3d-models/ford-mustang-shelby-gt500-0eaa7a16796540f29461ddae05ecdeb3" target="_blank" rel="noreferrer" className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/80 hover:text-foreground">
        Car model by Jiaxing · CC BY 4.0
      </a>
    </div>
  );
}
