import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  Float,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  Text
} from "@react-three/drei";
import { COMP3D } from "../../../constants/metadata";

interface ThreeDViewProps {
  // Add props if needed, e.g. for light intensity or theme
}

const ThreeDView: React.FC<ThreeDViewProps> = () => {
  return (
    <div style={{ width: "100%", height: "100%", background: "#060610" }}>
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        
        <Environment preset="city" />
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <group position={[0, -0.5, 0]}>
            {COMP3D.map((c: any, i: number) => (
              <D3Item key={i} item={c} index={i} total={COMP3D.length} />
            ))}
          </group>
          <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={20} blur={24} far={4} />
        </Suspense>
        
        <gridHelper args={[20, 20, "#1a1a30", "#0a0a1a"]} position={[0, -0.51, 0]} />
      </Canvas>

      <div style={{ position: "absolute", bottom: 20, left: 20, color: "#889", fontSize: 10, pointerEvents: "none" }}>
        3D Preview Mode · Right click to rotate · Scroll to zoom
      </div>
    </div>
  );
};

const D3Item: React.FC<{ item: any, index: number, total: number }> = ({ item, index, total }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 3.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const mesh = useMemo(() => {
    if (item.type === "Box") return <boxGeometry args={[1, 1, 1]} />;
    if (item.type === "Sphere") return <sphereGeometry args={[0.7, 32, 32]} />;
    if (item.type === "Torus") return <torusGeometry args={[0.6, 0.2, 16, 100]} />;
    if (item.type === "Cylinder") return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    return <octahedronGeometry args={[0.7]} />;
  }, [item.type]);

  const MaterialComp = item.type === "Sphere" ? MeshDistortMaterial : item.type === "Torus" ? MeshWobbleMaterial : "meshStandardMaterial";
  const matProps = item.type === "Sphere" ? { distort: 0.4, speed: 2 } : item.type === "Torus" ? { factor: 0.6, speed: 1.5 } : { metalness: 0.8, roughness: 0.2 };

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1} position={[x, 0.5, z]}>
      <mesh castShadow receiveShadow>
        {mesh}
        {(MaterialComp as any) === "meshStandardMaterial" ? (
          <meshStandardMaterial color={item.color} {...matProps} />
        ) : (
          <MaterialComp color={item.color} {...(matProps as any)} />
        )}
      </mesh>
      <Text
        position={[0, -1, 0]}
        fontSize={0.25}
        color="#889"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/dmsans/v11/rP2Fp2K8fY60AK95hZ-GGXI.woff"
      >
        {item.label}
      </Text>
    </Float>
  );
};

export default ThreeDView;
