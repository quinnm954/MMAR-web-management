import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Shelby GT500-inspired palette: deep blue body with gold racing stripes,
// tuned to the site's brand tokens.
const SKY_BLUE = new THREE.Color("hsl(200, 80%, 55%)");
const GOLD = new THREE.Color("hsl(45, 90%, 55%)");
const BODY_BLUE = new THREE.Color("hsl(215, 70%, 22%)");
const BODY_BLUE_DARK = new THREE.Color("hsl(215, 65%, 15%)");
const CHROME = new THREE.Color("hsl(220, 10%, 78%)");
const TIRE = new THREE.Color("hsl(220, 10%, 10%)");
const RIM = new THREE.Color("hsl(220, 10%, 60%)");
const BLACK_GLASS = new THREE.Color("hsl(220, 15%, 10%)");
const MID_METAL = new THREE.Color("hsl(220, 18%, 40%)");
const BG = "hsl(220, 15%, 8%)";

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.55, z]} rotation={[0, 0, Math.PI / 2]}>
      {/* Tire */}
      <mesh castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.36, 40]} />
        <meshStandardMaterial color={TIRE} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Rim face (outside) */}
      <mesh position={[0, 0.19, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.02, 32]} />
        <meshStandardMaterial color={RIM} roughness={0.35} metalness={0.9} />
      </mesh>
      {/* Rim center */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 24]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.2} roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
}

function GlowingEngine() {
  // Supercharged V8 hint under the hood
  return (
    <group position={[1.9, 0.15, 0]}>
      {/* Block */}
      <mesh castShadow>
        <boxGeometry args={[1.7, 0.5, 1.3]} />
        <meshStandardMaterial color={MID_METAL} roughness={0.5} metalness={0.75} />
      </mesh>
      {/* Supercharger */}
      <RoundedBox position={[0, 0.45, 0]} args={[1.1, 0.35, 0.7]} radius={0.06} smoothness={4} castShadow>
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={0.4} roughness={0.3} metalness={0.5} />
      </RoundedBox>
      {/* Snorkel intake */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
        <meshStandardMaterial color={CHROME} roughness={0.2} metalness={1} />
      </mesh>
      {/* Pulleys */}
      <mesh position={[0.7, 0.1, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.25} metalness={0.85} />
      </mesh>
      <mesh position={[-0.6, 0.1, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.14, 24]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.25} metalness={0.85} />
      </mesh>
    </group>
  );
}

function ShelbyGT500() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.12;
    groupRef.current.rotation.x = Math.sin(t * 0.09) * 0.02;
  });

  // Body dims: long, low, wide muscle-car proportions.
  const bodyLen = 6.4;
  const bodyWid = 2.6;

  return (
    <group ref={groupRef} scale={1.35} position={[0, -0.9, 0]}>
      {/* Lower body / chassis - long and wide */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyLen, 0.75, bodyWid]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Front fenders (wider haunches) */}
      <mesh position={[2.0, 0.05, 1.15]} castShadow>
        <boxGeometry args={[1.6, 0.55, 0.35]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[2.0, 0.05, -1.15]} castShadow>
        <boxGeometry args={[1.6, 0.55, 0.35]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Rear haunches */}
      <mesh position={[-2.1, 0.05, 1.15]} castShadow>
        <boxGeometry args={[1.7, 0.6, 0.35]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[-2.1, 0.05, -1.15]} castShadow>
        <boxGeometry args={[1.7, 0.6, 0.35]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Iconic dual racing stripes (gold to match brand) */}
      <mesh position={[0, 0.34, 0.25]} castShadow>
        <boxGeometry args={[bodyLen, 0.02, 0.22]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.34, -0.25]} castShadow>
        <boxGeometry args={[bodyLen, 0.02, 0.22]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Front splitter (aggressive lower lip) */}
      <mesh position={[3.15, -0.35, 0]} castShadow>
        <boxGeometry args={[0.15, 0.08, bodyWid + 0.4]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Front grille */}
      <mesh position={[3.22, 0.02, 0]} castShadow>
        <boxGeometry args={[0.05, 0.28, 1.4]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Cabin / roof (fastback profile, pushed back) */}
      <mesh position={[-0.6, 0.75, 0]} castShadow>
        <boxGeometry args={[2.6, 0.7, 2.2]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Fastback rear slope */}
      <mesh position={[-2.0, 0.55, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[1.2, 0.5, 2.15]} />
        <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Stripes over the roof */}
      <mesh position={[-0.6, 1.11, 0.25]} castShadow>
        <boxGeometry args={[2.6, 0.02, 0.22]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-0.6, 1.11, -0.25]} castShadow>
        <boxGeometry args={[2.6, 0.02, 0.22]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0.65, 0.75, 0]} rotation={[0, 0, -0.55]} castShadow>
        <boxGeometry args={[0.06, 0.9, 2.0]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Side windows */}
      <mesh position={[-0.6, 0.9, 1.11]} castShadow>
        <boxGeometry args={[2.3, 0.5, 0.02]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-0.6, 0.9, -1.11]} castShadow>
        <boxGeometry args={[2.3, 0.5, 0.02]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Rear glass */}
      <mesh position={[-2.15, 0.75, 0]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[0.05, 0.85, 2.0]} />
        <meshStandardMaterial color={BLACK_GLASS} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Rear spoiler */}
      <mesh position={[-3.0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.3, 0.05, bodyWid]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-3.0, 0.5, 1.15]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.08]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[-3.0, 0.5, -1.15]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.08]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Open hood (pivoted at the cowl) with hood scoop */}
      <group position={[1.0, 0.35, 0]} rotation={[0, 0, Math.PI / 3.2]}>
        <mesh position={[0.9, 0, 0]} castShadow>
          <boxGeometry args={[2.1, 0.09, 2.3]} />
          <meshStandardMaterial color={BODY_BLUE} roughness={0.35} metalness={0.7} />
        </mesh>
        {/* Hood stripes */}
        <mesh position={[0.9, 0.06, 0.25]} castShadow>
          <boxGeometry args={[2.1, 0.02, 0.22]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0.9, 0.06, -0.25]} castShadow>
          <boxGeometry args={[2.1, 0.02, 0.22]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Hood scoop */}
        <mesh position={[0.7, 0.18, 0]} castShadow>
          <boxGeometry args={[0.9, 0.18, 0.7]} />
          <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* Engine bay walls */}
      <mesh position={[1.9, 0.05, 1.05]} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.08]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[1.9, 0.05, -1.05]} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.08]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0.85, 0.05, 0]} castShadow>
        <boxGeometry args={[0.08, 0.55, 2.0]} />
        <meshStandardMaterial color={BODY_BLUE_DARK} roughness={0.6} metalness={0.5} />
      </mesh>

      <GlowingEngine />

      {/* Headlights - dual round */}
      <mesh position={[3.2, 0.12, 0.85]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={1.1} roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[3.2, 0.12, 0.55]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 24]} />
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={0.9} roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[3.2, 0.12, -0.55]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 24]} />
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={0.9} roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[3.2, 0.12, -0.85]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
        <meshStandardMaterial color={SKY_BLUE} emissive={SKY_BLUE} emissiveIntensity={1.1} roughness={0.2} metalness={0.2} />
      </mesh>

      {/* Tail lights */}
      <mesh position={[-3.2, 0.1, 0.7]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.5]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.9} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[-3.2, 0.1, -0.7]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.5]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.9} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Dual exhaust tips */}
      <mesh position={[-3.25, -0.35, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.14, 20]} />
        <meshStandardMaterial color={CHROME} roughness={0.2} metalness={1} />
      </mesh>
      <mesh position={[-3.25, -0.35, -0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.14, 20]} />
        <meshStandardMaterial color={CHROME} roughness={0.2} metalness={1} />
      </mesh>

      {/* Wheels - pushed to the corners */}
      <Wheel x={2.0} z={1.25} />
      <Wheel x={2.0} z={-1.25} />
      <Wheel x={-2.1} z={1.25} />
      <Wheel x={-2.1} z={-1.25} />

      {/* Ground shadow */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.5, 48]} />
        <meshBasicMaterial color={BG} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => ({
        position: [
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 3.5 - 0.3,
          (Math.random() - 0.5) * 3,
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
        camera={{ position: [1, 1.2, 9.5], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 8, 22]} />

        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 6, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} color={SKY_BLUE} />
        <directionalLight position={[0, 1, -5]} intensity={0.7} color={GOLD} />
        <pointLight position={[2.5, 1.2, 1]} intensity={2.2} color={GOLD} distance={7} />
        <pointLight position={[1.6, 1.0, 0]} intensity={2.0} color={SKY_BLUE} distance={6} />

        <ShelbyGT500 />
        <FloatingParticles />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.55}
          maxPolarAngle={Math.PI / 1.75}
          minPolarAngle={Math.PI / 3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
