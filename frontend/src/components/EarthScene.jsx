import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';

const EARTH_R = 2.0;

// Compute 3D orbit points from Keplerian-inspired params
export function computeOrbitPoints(semiMajor, eccentricity, inclination, raan, numPoints = 200) {
  const pts = [];
  const ecc = Math.min(eccentricity, 0.99);
  const b = semiMajor * Math.sqrt(Math.max(0, 1 - ecc * ecc));
  const c = semiMajor * ecc;
  const incRad = (inclination * Math.PI) / 180;
  const raanRad = (raan * Math.PI) / 180;

  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;
    const x = semiMajor * Math.cos(theta) - c;
    const z = b * Math.sin(theta);

    // Rotate by inclination around X axis
    const y_i = -z * Math.sin(incRad);
    const z_i = z * Math.cos(incRad);

    // Rotate by RAAN around Y axis
    const x_r = x * Math.cos(raanRad) + z_i * Math.sin(raanRad);
    const z_r = -x * Math.sin(raanRad) + z_i * Math.cos(raanRad);

    pts.push(new THREE.Vector3(x_r, y_i, z_r));
  }
  return pts;
}

function EarthWithTextures() {
  const earthRef = useRef();
  const [earthMap, normalMap, specMap] = useLoader(THREE.TextureLoader, [
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_normal_2048.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_specular_2048.jpg',
  ]);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025;
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        <meshPhongMaterial
          map={earthMap}
          normalMap={normalMap}
          specularMap={specMap}
          specular={new THREE.Color(0x2244aa)}
          shininess={40}
        />
      </mesh>
      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.03, 32, 32]} />
        <meshPhongMaterial color="#4488ff" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.1, 32, 32]} />
        <meshPhongMaterial color="#1133cc" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function EarthFallback() {
  const earthRef = useRef();
  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025;
  });
  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_R, 48, 48]} />
        <meshPhongMaterial color="#1a3d6e" emissive="#050d1a" shininess={40} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.03, 32, 32]} />
        <meshPhongMaterial color="#4488ff" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function EarthSphere() {
  return (
    <Suspense fallback={<EarthFallback />}>
      <EarthWithTextures />
    </Suspense>
  );
}

function OrbitPath({ orbit, isHighlighted, opacity }) {
  const points = useMemo(
    () => computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan),
    [orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan]
  );

  return (
    <Line
      points={points}
      color={orbit.color}
      lineWidth={isHighlighted ? 2.5 : 1.2}
      transparent
      opacity={opacity}
    />
  );
}

function OrbitSatellite({ orbit, points, isHighlighted }) {
  const meshRef = useRef();
  const tRef = useRef(Math.random());

  useFrame((_, delta) => {
    tRef.current = (tRef.current + orbit.speed * delta * 0.15) % 1;
    const idx = Math.floor(tRef.current * (points.length - 1));
    if (meshRef.current && points[idx]) {
      meshRef.current.position.copy(points[idx]);
    }
  });

  const size = isHighlighted ? 0.07 : 0.05;
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={orbit.color} />
    </mesh>
  );
}

function SceneContent({ activeOrbits, selectedOrbit, interactive }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 4, 6]} intensity={1.6} color="#fff8ee" castShadow={false} />
      <pointLight position={[-8, -4, -8]} intensity={0.15} color="#1144cc" />

      <Stars radius={180} depth={60} count={4500} factor={4} saturation={0.1} fade speed={0.3} />

      <EarthSphere />

      {activeOrbits.map(orbit => {
        const isHighlighted = selectedOrbit?.id === orbit.id;
        const opacity = isHighlighted ? 1.0 : (selectedOrbit ? 0.25 : 0.65);
        const points = computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan);
        return (
          <group key={orbit.id}>
            <OrbitPath orbit={orbit} isHighlighted={isHighlighted} opacity={opacity} />
            <OrbitSatellite orbit={orbit} points={points} isHighlighted={isHighlighted} />
          </group>
        );
      })}

      {interactive && (
        <OrbitControls
          enablePan={false}
          minDistance={3.5}
          maxDistance={28}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.6}
        />
      )}
    </>
  );
}

export function EarthScene({
  activeOrbits = [],
  selectedOrbit = null,
  interactive = true,
  height = '100%',
  cameraPosition = [0, 4, 12],
}) {
  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ background: '#030305' }}
      >
        <SceneContent
          activeOrbits={activeOrbits}
          selectedOrbit={selectedOrbit}
          interactive={interactive}
        />
      </Canvas>
    </div>
  );
}
