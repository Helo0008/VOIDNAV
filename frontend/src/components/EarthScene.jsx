import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const EARTH_R = 2.0;

// Compute 3D orbit points from Keplerian-inspired parameters
export function computeOrbitPoints(semiMajor, eccentricity, inclination, raan, numPoints = 200) {
  const pts = [];
  const ecc = Math.min(Math.max(eccentricity || 0, 0), 0.99);
  const sm = semiMajor || 3;
  const b = sm * Math.sqrt(Math.max(0, 1 - ecc * ecc));
  const c = sm * ecc;
  const incRad = ((inclination || 0) * Math.PI) / 180;
  const raanRad = ((raan || 0) * Math.PI) / 180;

  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;
    const x = sm * Math.cos(theta) - c;
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

function EarthMesh({ textureUrl }) {
  const earthRef = useRef();
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      textureUrl,
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setTexture(tex); },
      undefined,
      () => setTexture(null)
    );
  }, [textureUrl]);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025;
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        {texture
          ? <meshPhongMaterial map={texture} specular={new THREE.Color(0x1133aa)} shininess={40} />
          : <meshPhongMaterial color="#1a3d6e" emissive="#05101f" shininess={30} />
        }
      </mesh>
      {/* Atmosphere inner */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.025, 32, 32]} />
        <meshPhongMaterial color="#4499ff" transparent opacity={0.09} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Atmosphere outer glow */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.08, 32, 32]} />
        <meshPhongMaterial color="#1155ff" transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitPath({ orbit, isHighlighted, opacity }) {
  const points = useMemo(
    () => computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan),
    [orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan]
  );

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  // Glow pass (wider, less opaque)
  const glowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <group>
      <line geometry={glowGeo}>
        <lineBasicMaterial color={orbit.color} transparent opacity={opacity * 0.3} linewidth={3} />
      </line>
      <line geometry={geo}>
        <lineBasicMaterial color={orbit.color} transparent opacity={opacity} linewidth={2} />
      </line>
    </group>
  );
}

function OrbitSatellite({ orbit, points, isHighlighted }) {
  const meshRef = useRef();
  const tRef = useRef(Math.random());

  useFrame((_, delta) => {
    const spd = orbit.speed || 0.1;
    tRef.current = (tRef.current + spd * delta * 0.15) % 1;
    const idx = Math.floor(tRef.current * (points.length - 1));
    if (meshRef.current && points[idx]) {
      meshRef.current.position.copy(points[idx]);
    }
  });

  const size = isHighlighted ? 0.08 : 0.055;
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 8, 8]} />
        <meshBasicMaterial color={orbit.color} />
      </mesh>
    </group>
  );
}

const EARTH_TEXTURE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';

function SceneContent({ activeOrbits, selectedOrbit, interactive }) {
  return (
    <>
      <ambientLight intensity={0.2} color="#ffffff" />
      <directionalLight position={[8, 4, 6]} intensity={1.8} color="#fff8ee" />
      <pointLight position={[-8, -4, -8]} intensity={0.12} color="#1144cc" />

      <Stars radius={200} depth={60} count={5000} factor={4} saturation={0.1} fade speed={0.3} />

      <EarthMesh textureUrl={EARTH_TEXTURE} />

      {activeOrbits.map(orbit => {
        if (!orbit) return null;
        const isHighlighted = selectedOrbit?.id === orbit.id;
        const opacity = isHighlighted ? 0.95 : (selectedOrbit ? 0.2 : 0.6);
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
          maxDistance={30}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.7}
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
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: '#030305' }}
      >
        <SceneContent
          activeOrbits={activeOrbits.filter(Boolean)}
          selectedOrbit={selectedOrbit}
          interactive={interactive}
        />
      </Canvas>
    </div>
  );
}
