import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const SKY_BLUE = new THREE.Color("hsl(200, 80%, 55%)");
const GOLD = new THREE.Color("hsl(45, 90%, 55%)");
const DARK_METAL = new THREE.Color("hsl(220, 20%, 32%)");
const MID_METAL = new THREE.Color("hsl(220, 18%, 40%)");
const BLACK_GLASS = new THREE.Color("hsl(220, 15%, 12%)");
const BG = "hsl(220, 15%, 8%)";

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, -0.35, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.22, 32]} />
      <meshStandardMaterial color={DARK_METAL} roughness={0.7} metalness={0.4} />
    </mesh>
  );
}

function GlowingEngine() {
  return (
    <group position={[0.9, 0.05, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.55, 0.9]} />
        <meshStandardMaterial color={MID_METAL} roughness={0.5} metalness={0.7} />
      </mesh>
      <RoundedBox position={[0, 0.45, 0]} args={[1.2, 0.25, 0.6]} radius={0.06} smoothness={4} castShadow>
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={0.35} roughness={0.3} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0.6, -0.05, 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 24]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.25} metalness={0.8} />
      </mesh>
      <mesh position={[-0.5, -0.05, 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.12, 24]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.25} metalness={0.8} />
      </mesh>
      <mesh position={[0.05, -0.05, 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.55, 0.025, 6, 48]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.25} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

function CarWithOpenHood() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.08;
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.015;
  });

  return (
    <group ref={groupRef} scale={0.75} position={[0, -0.65, 0]}>
      {/* Lower body / chassis */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.7, 1.9]} />
        <meshStandardMaterial color={DARK_METAL} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Gold brand stripe along the side */}
      <mesh position={[0, 0.05, 0.96]} castShadow>
        <boxGeometry args={[4.0, 0.08, 0.02]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, -0.96]} castShadow>
        <boxGeometry args={[4.0, 0.08, 0.02]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Cabin / roof */}
      <mesh position={[-0.4, 0.75, 0]} castShadow>
        <boxGeometry args={[2.4, 0.75, 1.7]} />
        <meshStandardMaterial color={DARK_METAL} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.4, 0.75, 0.86]} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.02]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-0.4, 0.75, -0.86]} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.02]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-1.65, 0.75, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[1.5, 0.55, 0.02]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0.85, 0.75, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[1.5, 0.55, 0.02]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Open hood (pivoted at the back edge) */}
      <group position={[0.7, 0.35, 0]} rotation={[-Math.PI / 3.5, 0, 0]}>
        <mesh position={[0.45, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.08, 1.7]} />
          <meshStandardMaterial color={MID_METAL} roughness={0.5} metalness={0.7} />
        </mesh>
      </group>

      {/* Engine bay walls (so engine looks recessed) */}
      <mesh position={[0.9, -0.05, 0.8]} castShadow>
        <boxGeometry args={[1.6, 0.55, 0.08]} />
        <meshStandardMaterial color={DARK_METAL} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0.9, -0.05, -0.8]} castShadow>
        <boxGeometry args={[1.6, 0.55, 0.08]} />
        <meshStandardMaterial color={DARK_METAL} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0.05, -0.05, 0]} castShadow>
        <boxGeometry args={[0.08, 0.55, 1.6]} />
        <meshStandardMaterial color={DARK_METAL} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Glowing engine inside */}
      <GlowingEngine />

      {/* Headlights */}
      <mesh position={[2.05, 0.05, 0.55]} castShadow>
        <boxGeometry args={[0.05, 0.25, 0.35]} />
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={0.8} roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[2.05, 0.05, -0.55]} castShadow>
        <boxGeometry args={[0.05, 0.25, 0.35]} />
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={0.8} roughness={0.2} metalness={0.2} />
      </mesh>

      {/* Wheels */}
      <Wheel x={1.35} z={0.9} />
      <Wheel x={1.35} z={-0.9} />
      <Wheel x={-1.35} z={0.9} />
      <Wheel x={-1.35} z={-0.9} />

      {/* Ground shadow */}
      <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.0, 48]} />
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
        camera={{ position: [0, 0.2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 5, 18]} />

        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 6, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} color={SKY_BLUE} />
        <directionalLight position={[0, 1, -5]} intensity={0.7} color={GOLD} />
        <pointLight position={[2.2, 0.8, 1]} intensity={2.0} color={GOLD} distance={6} />
        <pointLight position={[1.2, 0.8, 0]} intensity={1.8} color={SKY_BLUE} distance={5} />

        <CarWithOpenHood />
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
