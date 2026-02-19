import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const EARTH_R = 2.0;
const EARTH_TEXTURE_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';

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

// Camera controls using Three.js OrbitControls directly
function CameraControls({ enabled }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 30;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.7;
    controlsRef.current = controls;
    return () => { controls.dispose(); };
  }, [camera, gl, enabled]);

  useFrame(() => {
    if (controlsRef.current) controlsRef.current.update();
  });

  return null;
}

// The full scene using useThree to manage objects directly
function SpaceScene({ activeOrbits, selectedOrbit, interactive }) {
  const { scene, camera } = useThree();
  const earthRef = useRef(null);
  const satelliteRefs = useRef({});
  const satelliteTimers = useRef({});

  // Build scene on mount
  useEffect(() => {
    const objects = [];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    const dirLight = new THREE.DirectionalLight(0xfff8ee, 2.0);
    dirLight.position.set(8, 4, 6);
    const dirLight2 = new THREE.DirectionalLight(0xaaccff, 0.3);
    dirLight2.position.set(-6, -3, -4);
    const pointLight = new THREE.PointLight(0x1144cc, 0.15);
    pointLight.position.set(-8, -4, -8);
    scene.add(dirLight2);
    objects.push(dirLight2);
    scene.add(ambientLight, dirLight, pointLight);
    objects.push(ambientLight, dirLight, pointLight, dirLight2);

    // Starfield
    const starCount = 4000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 120 + Math.random() * 80;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, sizeAttenuation: true, transparent: true, opacity: 0.85 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    objects.push(stars);

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ color: 0x1a3d6e, emissive: 0x060f1e, shininess: 25 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthRef.current = earth;
    scene.add(earth);
    objects.push(earth);

    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    textureLoader.load(
      EARTH_TEXTURE_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = tex;
        earthMat.color.setHex(0xffffff);
        earthMat.emissive.setHex(0x000000);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {} // fallback to blue planet
    );

    // Atmosphere
    const atmoGeo = new THREE.SphereGeometry(EARTH_R * 1.025, 32, 32);
    const atmoMat = new THREE.MeshPhongMaterial({ color: 0x4499ff, transparent: true, opacity: 0.1, side: THREE.BackSide });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmo);
    objects.push(atmo);

    return () => {
      objects.forEach(o => { scene.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    };
  }, [scene]);

  // Build orbit lines and satellites
  useEffect(() => {
    if (!activeOrbits.length) return;
    const orbitObjects = [];

    activeOrbits.forEach(orbit => {
      if (!orbit) return;
      const isHighlighted = selectedOrbit?.id === orbit.id;
      const opacity = isHighlighted ? 0.95 : (selectedOrbit ? 0.2 : 0.6);
      const points = computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan);

      // Orbit line
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: orbit.color, transparent: true, opacity });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      orbitObjects.push({ object: line, geo, mat });

      // Satellite dot
      const satGeo = new THREE.SphereGeometry(isHighlighted ? 0.075 : 0.05, 8, 8);
      const satMat = new THREE.MeshBasicMaterial({ color: orbit.color });
      const sat = new THREE.Mesh(satGeo, satMat);
      scene.add(sat);
      orbitObjects.push({ object: sat, geo: satGeo, mat: satMat });

      // Store refs for animation
      satelliteRefs.current[orbit.id] = { sat, points };
      satelliteTimers.current[orbit.id] = Math.random();
    });

    return () => {
      orbitObjects.forEach(({ object, geo, mat }) => {
        scene.remove(object);
        geo.dispose();
        mat.dispose();
      });
      satelliteRefs.current = {};
      satelliteTimers.current = {};
    };
  }, [scene, activeOrbits, selectedOrbit]);

  useFrame((_, delta) => {
    // Rotate Earth
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025;

    // Animate satellites
    Object.entries(satelliteRefs.current).forEach(([id, { sat, points }]) => {
      const orbit = activeOrbits.find(o => o?.id === id);
      if (!orbit || !points.length) return;
      const spd = (orbit.speed || 0.1) * 0.15;
      satelliteTimers.current[id] = (satelliteTimers.current[id] + spd * delta) % 1;
      const idx = Math.floor(satelliteTimers.current[id] * (points.length - 1));
      if (points[idx]) sat.position.copy(points[idx]);
    });
  });

  return (
    <>
      <CameraControls enabled={interactive} />
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
        <SpaceScene
          activeOrbits={activeOrbits.filter(Boolean)}
          selectedOrbit={selectedOrbit}
          interactive={interactive}
        />
      </Canvas>
    </div>
  );
}
