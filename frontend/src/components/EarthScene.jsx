import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Extend Three.js catalog
extend(THREE);

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
    const y_i = -z * Math.sin(incRad);
    const z_i = z * Math.cos(incRad);
    const x_r = x * Math.cos(raanRad) + z_i * Math.sin(raanRad);
    const z_r = -x * Math.sin(raanRad) + z_i * Math.cos(raanRad);
    pts.push(new THREE.Vector3(x_r, y_i, z_r));
  }
  return pts;
}

// Custom starfield without drei
function StarField() {
  const count = 4000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 120 + Math.random() * 80;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.25} sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

function EarthMesh() {
  const earthRef = useRef();
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setTexture(tex); },
      undefined,
      () => setTexture('error')
    );
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025;
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        {texture && texture !== 'error'
          ? <meshPhongMaterial map={texture} specular={new THREE.Color(0x1133aa)} shininess={35} />
          : <meshPhongMaterial color="#1a3d6e" emissive="#060f1e" shininess={25} />
        }
      </mesh>
      {/* Atmosphere inner */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.025, 32, 32]} />
        <meshPhongMaterial color="#4499ff" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.1, 32, 32]} />
        <meshPhongMaterial color="#1155ff" transparent opacity={0.035} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitLine({ orbit, opacity }) {
  const geo = useMemo(() => {
    const pts = computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan]);

  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: orbit.color, transparent: true, opacity }),
    [orbit.color, opacity]
  );

  useEffect(() => {
    mat.opacity = opacity;
  }, [mat, opacity]);

  return <primitive object={new THREE.Line(geo, mat)} />;
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

  const size = isHighlighted ? 0.075 : 0.05;
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
      <ambientLight intensity={0.22} />
      <directionalLight position={[8, 4, 6]} intensity={1.8} color="#fff8ee" />
      <pointLight position={[-8, -4, -8]} intensity={0.12} color="#1144cc" />

      <StarField />
      <EarthMesh />

      {activeOrbits.map(orbit => {
        if (!orbit) return null;
        const isHighlighted = selectedOrbit?.id === orbit.id;
        const opacity = isHighlighted ? 0.95 : (selectedOrbit ? 0.18 : 0.55);
        const points = computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan);
        return (
          <group key={orbit.id}>
            <OrbitLine orbit={orbit} opacity={opacity} />
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
        camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 600 }}
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
