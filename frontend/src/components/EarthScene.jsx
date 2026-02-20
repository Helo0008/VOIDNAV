import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const EARTH_R = 2.0;
const EARTH_TEXTURE_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';
const TRAIL_LEN = 60;

export function computeOrbitPoints(semiMajor, eccentricity, inclination, raan, numPoints = 300) {
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

// Build Keplerian time array so satellites move faster near perigee
function buildTimeArray(points) {
  const weights = points.map(p => {
    const r = p.length();
    return r > 0 ? r * r : 0.001; // time ∝ r² (Kepler 2nd law)
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const times = [0];
  for (let i = 1; i < weights.length; i++) {
    times.push(times[i - 1] + weights[i] / total);
  }
  return times;
}

// Binary search for time array lookup
function findIdx(times, t) {
  let lo = 0, hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] < t) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// Camera smooth control
function CameraControls({ enabled, targetRef, autoRotate }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);
  const isUserInteracting = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 30;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.8;
    controls.addEventListener('start', () => { isUserInteracting.current = true; });
    controls.addEventListener('end', () => { setTimeout(() => { isUserInteracting.current = false; }, 1500); });
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl, enabled]);

  useFrame((_, delta) => {
    if (controlsRef.current) controlsRef.current.update();

    // Smooth camera transition toward target
    if (targetRef?.current && !isUserInteracting.current) {
      camera.position.lerp(targetRef.current, delta * 1.2);
    }
  });
  return null;
}

// Create a label sprite using canvas texture
function createLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 48);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.roundRect?.(2, 2, 252, 44, 8) || ctx.fillRect(2, 2, 252, 44);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.roundRect?.(2, 2, 252, 44, 8) || ctx.strokeRect(2, 2, 252, 44);
  ctx.stroke();
  ctx.font = 'bold 20px Rajdhani, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 24);
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 0.42, 1);
  return sprite;
}

// Create a radial glow sprite for satellites
function createGlowSprite(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.25, color + '80');
  gradient.addColorStop(0.6, color + '20');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const glowMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false });
  const sprite = new THREE.Sprite(glowMat);
  sprite.scale.set(0.55, 0.55, 1);
  return sprite;
}

function SpaceScene({ activeOrbits, selectedOrbit, interactive, showLabels, cameraTargetRef, constellationOrbits }) {
  const { scene, camera } = useThree();
  const earthRef = useRef(null);

  // Persistent orbit object map: id -> { line, sat, trailLine, trailBuf, trailMat, label, points, times, t }
  const orbitMapRef = useRef({});

  // ─── Static scene: lights + stars + earth ───────────────────────────────
  useEffect(() => {
    const objs = [];

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const sun = new THREE.DirectionalLight(0xfff8ee, 2.1);
    sun.position.set(8, 4, 6);
    const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
    fill.position.set(-6, -3, -4);
    scene.add(ambient, sun, fill);
    objs.push(ambient, sun, fill);

    // Stars
    const count = 5000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 130 + Math.random() * 70;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, sizeAttenuation: true, transparent: true, opacity: 0.9 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    objs.push(stars);

    // Earth
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ color: 0x1a3d6e, emissive: 0x060f1e, shininess: 25 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthRef.current = earth;
    scene.add(earth);
    objs.push(earth);

    new THREE.TextureLoader().load(EARTH_TEXTURE_URL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.color.setHex(0xffffff);
      earthMat.emissive.setHex(0x000000);
      earthMat.needsUpdate = true;
    });

    // Atmosphere
    const atmoGeo = new THREE.SphereGeometry(EARTH_R * 1.025, 32, 32);
    const atmoMat = new THREE.MeshPhongMaterial({ color: 0x4499ff, transparent: true, opacity: 0.1, side: THREE.BackSide });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmo); objs.push(atmo);

    return () => {
      objs.forEach(o => {
        scene.remove(o);
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
    };
  }, [scene]);

  // ─── Sync orbit objects with activeOrbits ────────────────────────────────
  useEffect(() => {
    const targetIds = new Set(activeOrbits.filter(Boolean).map(o => o.id));

    // Remove obsolete
    Object.keys(orbitMapRef.current).forEach(id => {
      if (!targetIds.has(id)) {
        const e = orbitMapRef.current[id];
        [e.line, e.sat, e.trailLine, e.label, e.glow].forEach(o => {
          if (o) { scene.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }
        });
        if (e.trailMat) e.trailMat.dispose();
        delete orbitMapRef.current[id];
      }
    });

    // Add new
    activeOrbits.filter(Boolean).forEach(orbit => {
      if (orbitMapRef.current[orbit.id]) return;

      const points = computeOrbitPoints(orbit.semiMajor, orbit.eccentricity, orbit.inclination, orbit.raan, 300);
      const times = buildTimeArray(points);

      // Orbit line
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: orbit.color, transparent: true, opacity: 0.65 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Trail with vertex colors for gradient fade
      const trailBuf = new Array(TRAIL_LEN).fill(null).map(() => new THREE.Vector3());
      const trailPos = new Float32Array(TRAIL_LEN * 3);
      const trailColorArr = new Float32Array(TRAIL_LEN * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColorArr, 3));
      trailGeo.setDrawRange(0, 0);
      const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      trailLine.frustumCulled = false;
      scene.add(trailLine);

      // Satellite
      const satGeo = new THREE.SphereGeometry(0.065, 10, 10);
      const satMat = new THREE.MeshBasicMaterial({ color: orbit.color });
      const sat = new THREE.Mesh(satGeo, satMat);
      scene.add(sat);

      // Satellite glow
      const glow = createGlowSprite(orbit.color);
      scene.add(glow);

      // Label sprite
      const label = createLabelSprite(orbit.shortName, orbit.color);
      label.visible = false;
      scene.add(label);

      orbitMapRef.current[orbit.id] = {
        orbit, line, lineMat, sat, satMat, glow,
        trailLine, trailGeo, trailMat, trailBuf, trailHead: 0, trailCount: 0,
        label, points, times, trailColor: new THREE.Color(orbit.color),
        t: Math.random(),
      };
    });
  }, [scene, activeOrbits]);

  // ─── Update opacity when selectedOrbit changes ───────────────────────────
  useEffect(() => {
    Object.values(orbitMapRef.current).forEach(e => {
      const isHighlighted = selectedOrbit?.id === e.orbit.id;
      const opacity = isHighlighted ? 0.95 : (selectedOrbit ? 0.18 : 0.65);
      e.lineMat.opacity = opacity;
      e.trailMat.opacity = isHighlighted ? 0.85 : 0.5;
      e.satMat.color.setStyle(e.orbit.color);
      e.sat.scale.setScalar(isHighlighted ? 1.4 : 1);
      if (e.glow) {
        e.glow.scale.setScalar(isHighlighted ? 0.8 : 0.55);
        e.glow.material.opacity = isHighlighted ? 0.7 : 0.4;
      }
    });
  }, [selectedOrbit]);

  // ─── Update labels visibility ─────────────────────────────────────────────
  useEffect(() => {
    Object.values(orbitMapRef.current).forEach(e => {
      e.label.visible = showLabels;
    });
  }, [showLabels]);

  // ─── GPS Constellation objects (separate, persistent) ─────────────────────
  const constellationRef = useRef([]);
  useEffect(() => {
    // Clear previous
    constellationRef.current.forEach(o => { scene.remove(o); o.geometry.dispose(); o.material.dispose(); });
    constellationRef.current = [];
    if (!constellationOrbits?.length) return;

    constellationOrbits.forEach(co => {
      const pts = computeOrbitPoints(co.semiMajor, co.eccentricity, co.inclination, co.raan, 100);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: co.color, transparent: true, opacity: 0.22 });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      constellationRef.current.push(line);

      const satGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const satMat = new THREE.MeshBasicMaterial({ color: co.color });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.position.copy(pts[Math.floor(co.phase * pts.length)]);
      scene.add(sat);
      constellationRef.current.push(sat);
    });

    return () => {
      constellationRef.current.forEach(o => { scene.remove(o); o.geometry?.dispose(); o.material?.dispose(); });
      constellationRef.current = [];
    };
  }, [scene, constellationOrbits]);

  // ─── Animation loop ────────────────────────────────────────────────────────
  const pulseRef = useRef(0);
  useFrame((_, delta) => {
    pulseRef.current += delta;

    // Rotate Earth
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025;

    // Animate each orbit's satellite with smooth lerp + Keplerian speed
    Object.values(orbitMapRef.current).forEach(e => {
      const spd = (e.orbit.speed || 0.1) * 0.18;
      e.t = (e.t + spd * delta) % 1;

      // Keplerian position: find index via time array
      const idx = findIdx(e.times, e.t);
      const nextIdx = Math.min(idx + 1, e.points.length - 1);
      const frac = idx < e.times.length - 1
        ? (e.t - e.times[idx]) / Math.max(e.times[nextIdx] - e.times[idx], 1e-6)
        : 0;

      // Smooth lerp between adjacent points
      const newPos = new THREE.Vector3().lerpVectors(e.points[idx], e.points[nextIdx], frac);
      e.sat.position.copy(newPos);

      // Pulse scale for highlighted satellite
      if (selectedOrbit?.id === e.orbit.id) {
        const pScale = 1.3 + Math.sin(pulseRef.current * 3) * 0.2;
        e.sat.scale.setScalar(pScale);
      }

      // Update trail circular buffer
      e.trailBuf[e.trailHead % TRAIL_LEN].copy(newPos);
      e.trailHead++;
      e.trailCount = Math.min(e.trailCount + 1, TRAIL_LEN);

      if (e.trailCount > 1) {
        const posAttr = e.trailGeo.attributes.position;
        const colorAttr = e.trailGeo.attributes.color;
        const start = e.trailHead % TRAIL_LEN;
        for (let i = 0; i < e.trailCount; i++) {
          const bufIdx = (start + i) % TRAIL_LEN;
          const p = e.trailBuf[bufIdx];
          posAttr.setXYZ(i, p.x, p.y, p.z);
          // Gradient: oldest=dark, newest=bright
          const fade = i / Math.max(1, e.trailCount - 1);
          const tc = e.trailColor;
          colorAttr.setXYZ(i, tc.r * fade, tc.g * fade, tc.b * fade);
        }
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        e.trailGeo.setDrawRange(0, e.trailCount);
      }

      // Update glow position
      if (e.glow) e.glow.position.copy(newPos);

      // Update label position (above satellite)
      if (e.label.visible) {
        e.label.position.copy(newPos);
        e.label.position.y += 0.28;
      }
    });
  });

  return <CameraControls enabled={interactive} targetRef={cameraTargetRef} />;
}

export function EarthScene({
  activeOrbits = [],
  selectedOrbit = null,
  interactive = true,
  height = '100%',
  cameraPosition = [0, 4, 12],
  showLabels = false,
  constellationOrbits = null,
}) {
  const cameraTargetRef = useRef(new THREE.Vector3(...cameraPosition));

  // Update camera target when selected orbit changes
  useEffect(() => {
    if (selectedOrbit?.semiMajor) {
      const dist = selectedOrbit.semiMajor * 2.8;
      cameraTargetRef.current.set(0, dist * 0.3, dist);
    } else {
      cameraTargetRef.current.set(...cameraPosition);
    }
  }, [selectedOrbit?.id]);

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
          showLabels={showLabels}
          cameraTargetRef={cameraTargetRef}
          constellationOrbits={constellationOrbits}
        />
      </Canvas>
    </div>
  );
}
