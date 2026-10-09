import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

const BARS = 365;
const BLUE = new THREE.Color('hsl(200, 80%, 60%)');
const GOLD = new THREE.Color('hsl(45, 90%, 55%)');

const spiralPos = (i: number): [number, number] => {
  const a = (i / 30.4) * Math.PI * 2;
  const r = 2.2 + i * 0.03;
  return [Math.cos(a) * r, Math.sin(a) * r];
};

function Bars() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < BARS; i++) {
      const [x, z] = spiralPos(i);
      const wave = Math.sin(i * 0.12 - t * 1.4) * 0.5 + 0.5;
      const h = 0.15 + wave * wave * 3.2 + Math.sin(i * 0.37 + t * 0.6) * 0.15;
      obj.position.set(x, h / 2, z);
      obj.rotation.set(0, -Math.atan2(z, x), 0);
      obj.scale.set(1, h, 1);
      obj.updateMatrix();
      m.setMatrixAt(i, obj.matrix);
      const mix = (Math.sin(i * 0.02 + t * 0.3) * 0.5 + 0.5) * 0.6 + wave * 0.4;
      col.copy(BLUE).lerp(GOLD, mix);
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BARS]} castShadow>
      <boxGeometry args={[0.16, 1, 0.16]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.12} metalness={0.3} roughness={0.4} />
    </instancedMesh>
  );
}

function Sparks() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 600, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 2 + Math.random() * 16, a = Math.random() * Math.PI * 2;
      p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = Math.random() * 9; p[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += Math.min(d, 0.05) * 0.05;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + Math.min(d, 0.05) * 0.3;
      if (y > 9) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={GOLD} size={0.06} transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.08;
    ref.current.scale.setScalar(s);
    ref.current.rotation.y = clock.elapsedTime * 0.4;
  });
  return (
    <mesh ref={ref} position={[0, 1.4, 0]}>
      <icosahedronGeometry args={[0.8, 1]} />
      <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.9} wireframe />
    </mesh>
  );
}

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function TimeSpiral3D({ name = 'Mike' }: { name?: string }) {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  return (
    <div className="relative h-[calc(100dvh-9rem)] min-h-[520px] w-full overflow-hidden rounded-xl border border-border bg-background">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 14, narrow ? 28 : 18], fov: 45 }}>
        <color attach="background" args={['#07111f']} />
        <fog attach="fog" args={['#07111f', 24, 55]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 16, 8]} intensity={1.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 3, 0]} intensity={25} color={GOLD} distance={12} />
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
        <Bars />
        <Core />
        <Sparks />
        <OrbitControls enablePan={false} minDistance={7} maxDistance={40} maxPolarAngle={Math.PI / 2.1} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4">
        <p className="font-display text-2xl sm:text-3xl text-foreground drop-shadow">{greeting()}, {name}</p>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
    </div>
  );
}
