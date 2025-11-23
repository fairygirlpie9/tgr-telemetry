
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { TrackPoint, SimulationState, CarStatus } from '../types';
import { createTrackCurve } from '../utils';

interface TrackViewProps {
  trackPoints: TrackPoint[];
  simState: SimulationState;
  onSelectCar: (id: string) => void;
}

const CarMesh: React.FC<{
  carId: string;
  position: number;
  trackCurve: THREE.CatmullRomCurve3;
  selected: boolean;
  braking: boolean;
  onClick: () => void;
  label: string;
}> = ({ carId, position, trackCurve, selected, braking, onClick, label }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Calculate position and rotation along the curve
  const pos = useMemo(() => trackCurve.getPointAt(position % 1), [position, trackCurve]);
  const tangent = useMemo(() => trackCurve.getTangentAt(position % 1), [position, trackCurve]);

  useFrame(() => {
    if (meshRef.current) {
      // Lift car slightly higher to sit on top of the new wider track
      const adjustedPos = pos.clone();
      adjustedPos.y += 0.2; 
      
      meshRef.current.position.copy(adjustedPos);
      meshRef.current.lookAt(adjustedPos.clone().add(tangent));
    }
  });

  // Define colors based on selection
  const primaryColor = selected ? '#ff4500' : '#00bfff'; // OrangeRed for selected, DeepSkyBlue for others
  const glowColor = selected ? '#ff6347' : '#00ced1';
  
  return (
    <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      
      {/* --- GR86 Rounder Shape --- */}
      
      {/* 1. Main Chassis (Rounded) */}
      <RoundedBox 
        args={[1.9, 0.6, 4.3]} 
        radius={0.15} 
        smoothness={4} 
        castShadow 
        receiveShadow 
        position={[0, 0.35, 0]}
      >
        <meshStandardMaterial 
          color={primaryColor} 
          emissive={glowColor}
          emissiveIntensity={selected ? 0.4 : 0.2}
          metalness={0.5} 
          roughness={0.3} 
        />
      </RoundedBox>

      {/* 2. Cabin Structure (Rounded) */}
      <RoundedBox 
        args={[1.45, 0.55, 2.2]} 
        radius={0.2} 
        smoothness={4} 
        position={[0, 0.85, -0.2]} 
        castShadow
      >
        <meshStandardMaterial 
           color={primaryColor} 
           metalness={0.5} 
           roughness={0.3} 
        />
      </RoundedBox>

      {/* 3. Windows (Black) */}
      
      {/* Front Windshield */}
      <mesh position={[0, 0.9, 0.91]} rotation={[Math.PI * 0.15, 0, 0]}>
          <planeGeometry args={[1.2, 0.5]} />
          <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Rear Window */}
      <mesh position={[0, 0.9, -1.31]} rotation={[-Math.PI * 0.15, 0, 0]}>
          <planeGeometry args={[1.2, 0.5]} />
          <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Side Windows (Left & Right) */}
      <mesh position={[0.74, 0.9, -0.2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.4, 0.35]} />
          <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[-0.74, 0.9, -0.2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.4, 0.35]} />
          <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>


      {/* 4. Ducktail Spoiler (Integrated look) */}
      <RoundedBox 
        args={[1.8, 0.2, 0.5]} 
        radius={0.05} 
        smoothness={2}
        position={[0, 0.7, -2.0]} 
        castShadow
      >
         <meshStandardMaterial color={primaryColor} />
      </RoundedBox>

      {/* 5. Wheels (Black Cylinders) */}
      <mesh position={[0.85, 0.3, 1.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.33, 0.33, 0.25, 24]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.85, 0.3, 1.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.33, 0.33, 0.25, 24]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.85, 0.3, -1.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 24]} /> 
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.85, 0.3, -1.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 24]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* --- Effects --- */}

      {/* Brake Lights */}
      {braking && (
        <mesh position={[0, 0.5, -2.15]}>
            <boxGeometry args={[1.6, 0.15, 0.1]} />
            <meshBasicMaterial color="#ff0000" toneMapped={false} />
        </mesh>
      )}

      {/* Selected Highlight Ring */}
      {selected && (
         <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
             <ringGeometry args={[3, 3.5, 32]} />
             <meshBasicMaterial color="#ff4500" opacity={0.4} transparent />
         </mesh>
      )}
      
      {/* Label */}
      <Html position={[0, 3, 0]} center distanceFactor={30}>
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`px-1.5 py-0.5 text-xs font-bold rounded border cursor-pointer select-none font-['Share_Tech_Mono'] shadow-lg transition-all duration-200 ${
                selected 
                ? 'bg-red-600 border-white text-white scale-110 z-50' 
                : 'bg-black/80 border-cyan-500 text-cyan-300 opacity-80 hover:opacity-100 hover:scale-105'
            }`}
        >
            #{label}
        </div>
      </Html>
    </group>
  );
};

const TrackView: React.FC<TrackViewProps> = ({ trackPoints, simState, onSelectCar }) => {
  const curve = useMemo(() => createTrackCurve(trackPoints), [trackPoints]);
  
  // Create line geometry from curve points for smoother visual
  const linePoints = useMemo(() => curve.getPoints(600), [curve]);

  return (
    <group>
      {/* -- TRACK VISUALIZATION -- */}
      
      {/* Main Asphalt Surface (Solid Grey, No Glow, No Dashes) */}
      <Line
        points={linePoints}
        color="#a3a3a3" // Light Grey for high visibility against black
        lineWidth={10}
        position={[0, -0.1, 0]}
      />
      
      {/* Start/Finish Line */}
      <mesh position={[linePoints[0].x, 0, linePoints[0].z]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[6, 0.1, 16]} />
          <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[linePoints[0].x, 0.05, linePoints[0].z]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[6, 0.1, 16]} />
          <meshBasicMaterial color="black" wireframe />
      </mesh>

      {/* Cars */}
      {(Object.entries(simState.cars) as [string, CarStatus][]).map(([id, carState]) => (
        <CarMesh
            key={id}
            carId={id}
            label={id}
            position={carState.position}
            trackCurve={curve}
            selected={simState.selectedCarId === id}
            braking={carState.braking}
            onClick={() => onSelectCar(id)}
        />
      ))}

      {/* -- ENVIRONMENT -- */}

      {/* Ground Plane (Dark Void) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      
      {/* Grid Helper for Depth Perception */}
      <polarGridHelper args={[400, 16, 8, 64, 0x333333, 0x111111]} position={[0, -1.8, 0]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={1.5} castShadow />
      {/* Rim light for cars */}
      <directionalLight position={[-100, 50, -100]} intensity={0.5} color="#4444ff"/>
    </group>
  );
};

export default TrackView;
