import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const SKY_BLUE = new THREE.Color("hsl(200, 80%, 55%)");
const GOLD = new THREE.Color("hsl(45, 90%, 55%)");
const DARK_METAL = new THREE.Color("hsl(220, 15%, 18%)");
const MID_METAL = new THREE.Color("hsl(220, 15%, 28%)");
const BG = "hsl(220, 15%, 8%)";

function EngineAssembly() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.08 + Math.sin(t * 0.2) * 0.05;
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.03;
  });

  const cylinders = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        position: [0.7 * (i - 2.5), 0.55, 0.2 + (i % 2) * 0.15] as [number, number, number],
        scale: [0.22, 0.55, 0.22] as [number, number, number],
      })),
    []
  );

  return (
    <group ref={groupRef} scale={0.55} position={[0, -0.9, 0]}>
      {/* Engine block */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.1, 1.6]} />
        <meshStandardMaterial color={DARK_METAL} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Oil pan */}
      <mesh position={[0, -0.95, 0]} castShadow>
        <boxGeometry args={[3.2, 0.8, 1.4]} />
        <meshStandardMaterial color={MID_METAL} roughness={0.6} metalness={0.6} />
      </mesh>

      {/* Cylinder heads */}
      <mesh position={[0, 0.75, 0.15]} castShadow>
        <boxGeometry args={[3.5, 0.5, 1.2]} />
        <meshStandardMaterial color={MID_METAL} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Cylinders / valve covers */}
      {cylinders.map((c, i) => (
        <mesh key={i} position={c.position} castShadow>
          <cylinderGeometry args={[c.scale[0] / 2, c.scale[0] / 2, c.scale[1], 24]} />
          <meshStandardMaterial color={DARK_METAL} roughness={0.4} metalness={0.8} />
        </mesh>
      ))}

      {/* Sky-blue intake manifold */}
      <RoundedBox position={[0, 1.2, -0.1]} args={[2.2, 0.5, 0.9]} radius={0.12} smoothness={4} castShadow>
        <meshStandardMaterial color={SKY_BLUE} roughness={0.3} metalness={0.4} emissive={SKY_BLUE} emissiveIntensity={0.15} />
      </RoundedBox>

      {/* Gold alternator pulley */}
      <mesh position={[1.9, 0.2, 0.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 32]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.8} emissive={GOLD} emissiveIntensity={0.2} />
      </mesh>

      {/* Gold crank pulley */}
      <mesh position={[-1.6, 0.2, 0.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.8} emissive={GOLD} emissiveIntensity={0.2} />
      </mesh>

      {/* Belt path */}
      <mesh position={[0.15, 0.2, 0.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[1.75, 0.04, 8, 64]} />
        <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.5} emissive={GOLD} emissiveIntensity={0.15} />
      </mesh>

      {/* Accent pipes / runners */}
      <mesh position={[0.8, 0.1, -0.65]} rotation={[0, 0, -0.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 2.2, 16]} />
        <meshStandardMaterial color={SKY_BLUE} roughness={0.35} metalness={0.5} emissive={SKY_BLUE} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-0.8, 0.1, -0.65]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 2.2, 16]} />
        <meshStandardMaterial color={SKY_BLUE} roughness={0.35} metalness={0.5} emissive={SKY_BLUE} emissiveIntensity={0.1} />
      </mesh>

      {/* Ground shadow disc */}
      <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshBasicMaterial color={BG} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        position: [
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3 - 0.5,
          (Math.random() - 0.5) * 2.5,
        ] as [number, number, number],
        color: Math.random() > 0.5 ? SKY_BLUE : GOLD,
        speed: 0.5 + Math.random() * 1.2,
        radius: 0.04 + Math.random() * 0.06,
      })),
    []
  );

  return (
    <>
      {particles.map((p, i) => (
        <Float key={i} speed={p.speed} rotationIntensity={0.4} floatIntensity={0.8}>
          <mesh position={p.position}>
            <sphereGeometry args={[p.radius, 16, 16]} />
            <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.6} roughness={0.2} metalness={0.1} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function HeroEngineScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.5, 6.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 5, 18]} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 6, 4]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} color={SKY_BLUE} />
        <pointLight position={[2, 2, 2]} intensity={1.5} color={GOLD} distance={8} />
        <pointLight position={[-2, 1, 2]} intensity={1.2} color={SKY_BLUE} distance={8} />

        <EngineAssembly />
        <FloatingParticles />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
