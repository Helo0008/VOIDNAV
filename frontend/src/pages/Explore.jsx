import { useState, useMemo } from 'react';
import { Navigation } from '../components/Navigation';
import { EarthScene, computeOrbitPoints } from '../components/EarthScene';
import { ORBITS, ORBIT_ORDER } from '../data/orbits';
import { useProgress } from '../hooks/useProgress';
import { RotateCcw, Eye, EyeOff, Satellite, ArrowRightLeft } from 'lucide-react';

// GPS constellation: 6 planes x 4 sats, 55° inc, ~20,200 km
const GPS_CONSTELLATION = [];
for (let plane = 0; plane < 6; plane++) {
  for (let sat = 0; sat < 4; sat++) {
    GPS_CONSTELLATION.push({
      semiMajor: 4.8,
      eccentricity: 0.01,
      inclination: 55,
      raan: plane * 60,
      color: '#00FF94',
      phase: (sat / 4) + (plane * 0.05),
    });
  }
}

const PARAM_DEFAULTS = {
  semiMajor: 3.0,
  eccentricity: 0.1,
  inclination: 45,
  raan: 0,
  color: '#00F0FF',
  speed: 0.12,
};

function SliderParam({ label, value, min, max, step, unit, onChange, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: color || '#00F0FF', fontWeight: 500 }}>
          {typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 1) : value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color || '#00F0FF', background: `linear-gradient(to right, ${color || '#00F0FF'} ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
        data-testid={`slider-${label.toLowerCase().replace(' ', '-')}`}
      />
    </div>
  );
}

export default function Explore() {
  const { isOrbitUnlocked } = useProgress();
  const [params, setParams] = useState(PARAM_DEFAULTS);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [overlayIds, setOverlayIds] = useState([]);
  const [hohmannMode, setHohmannMode] = useState(false);

  const toggleOverlay = (id) => setOverlayIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const overlayOrbits = useMemo(() => overlayIds.map(id => ORBITS[id]).filter(Boolean), [overlayIds]);

  // Hohmann transfer: LEO → GEO
  const hohmannOrbits = useMemo(() => {
    if (!hohmannMode) return [];
    const r1 = 2.45, r2 = 7.8;
    const transferSMA = (r1 + r2) / 2;
    const transferEcc = (r2 - r1) / (r2 + r1);
    return [
      { ...ORBITS.leo, id: 'h-start', shortName: 'LEO', color: '#00FF94', speed: 0.15 },
      { id: 'h-transfer', name: 'Transfer Orbit', shortName: 'TRANSFER', color: '#E879F9', semiMajor: transferSMA, eccentricity: transferEcc, inclination: 0.5, raan: 0, speed: 0.06 },
      { ...ORBITS.geo, id: 'h-end', shortName: 'GEO', color: '#FFD700', speed: 0.04 },
    ];
  }, [hohmannMode]);

  const customOrbit = useMemo(() => ({
    id: 'custom',
    name: 'Custom Orbit',
    shortName: 'CUSTOM',
    color: params.color,
    semiMajor: params.semiMajor,
    eccentricity: params.eccentricity,
    inclination: params.inclination,
    raan: params.raan,
    speed: params.speed,
  }), [params]);

  // Derive computed orbital data
  const earthR = 6371;
  const scale = (earthR * (params.semiMajor - 2.0)) / (8.0 - 2.0); // approx
  const altKm = Math.max(200, Math.round(((params.semiMajor - 2.0) / 6.0) * 33000));
  const periodMin = Math.round(84.3 * Math.pow((params.semiMajor / 2.0), 1.5));
  const b = params.semiMajor * Math.sqrt(1 - params.eccentricity ** 2);
  const perigeeFactor = params.semiMajor * (1 - params.eccentricity);
  const apogeeFactor = params.semiMajor * (1 + params.eccentricity);
  const periKm = Math.max(200, Math.round(((perigeeFactor - 2.0) / 6.0) * 33000));
  const apoKm = Math.round(((apogeeFactor - 2.0) / 6.0) * 33000);

  const loadPreset = (id) => {
    const o = ORBITS[id];
    if (!o) return;
    setParams({
      semiMajor: o.semiMajor,
      eccentricity: o.eccentricity,
      inclination: o.inclination,
      raan: o.raan,
      color: o.color,
      speed: o.speed,
    });
    setSelectedPresetId(id);
  };

  const reset = () => {
    setParams(PARAM_DEFAULTS);
    setSelectedPresetId(null);
  };

  const dataRows = [
    ['TYPE', params.eccentricity < 0.05 ? 'Circular' : params.eccentricity < 0.4 ? 'Near-Circular' : 'Elliptical'],
    ['SEMI-MAJOR', `${params.semiMajor.toFixed(2)} units`],
    ['PERIGEE', `~${periKm.toLocaleString()} km`],
    ['APOGEE', `~${apoKm.toLocaleString()} km`],
    ['PERIOD', `~${periodMin > 1440 ? (periodMin / 1440).toFixed(1) + ' days' : periodMin + ' min'}`],
    ['INCLINATION', `${params.inclination.toFixed(1)}°`],
    ['ECCENTRICITY', params.eccentricity.toFixed(3)],
  ];

  return (
    <div style={{ height: '100vh', background: '#030305', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navigation />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', marginTop: '64px' }}>
        {/* 3D Scene */}
        <div style={{ flex: 1, position: 'relative' }}>
          <EarthScene
            activeOrbits={hohmannMode ? hohmannOrbits : [customOrbit, ...overlayOrbits]}
            selectedOrbit={hohmannMode ? null : customOrbit}
            height="100%"
            interactive={true}
            showLabels={showLabels || hohmannMode}
            constellationOrbits={showGPS ? GPS_CONSTELLATION : null}
          />
          <div style={{ position: 'absolute', top: '16px', left: '16px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
            DRAG TO ROTATE &bull; SCROLL TO ZOOM
          </div>
        </div>

        {/* Control Panel */}
        <div
          style={{ width: '300px', flexShrink: 0, overflowY: 'auto', background: 'rgba(11,16,21,0.95)', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}
          data-testid="control-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>ORBIT BUILDER</p>
              <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '20px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                Parameters
              </h2>
            </div>
            <button
              onClick={reset}
              className="p-2 rounded-lg flex items-center gap-1"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', fontSize: '11px', fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s, border-color 0.2s' }}
              data-testid="reset-params-btn"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Color picker */}
          <div className="mb-5">
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>ORBIT COLOR</p>
            <div className="flex gap-2 flex-wrap">
              {['#00F0FF', '#00FF94', '#FFD700', '#FF3B30', '#E879F9', '#FB923C', '#60A5FA'].map(c => (
                <button
                  key={c}
                  onClick={() => setParams(p => ({ ...p, color: c }))}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: params.color === c ? `2px solid #fff` : '2px solid transparent', cursor: 'pointer', transition: 'border-color 0.2s', flexShrink: 0 }}
                  data-testid={`color-${c.slice(1)}`}
                />
              ))}
            </div>
          </div>

          {/* Sliders */}
          <SliderParam label="Semi-Major Axis" value={params.semiMajor} min={2.2} max={10} step={0.1} unit=" u" onChange={v => setParams(p => ({ ...p, semiMajor: v }))} color={params.color} />
          <SliderParam label="Eccentricity" value={params.eccentricity} min={0} max={0.92} step={0.01} unit="" onChange={v => setParams(p => ({ ...p, eccentricity: v }))} color={params.color} />
          <SliderParam label="Inclination" value={params.inclination} min={0} max={180} step={0.5} unit="°" onChange={v => setParams(p => ({ ...p, inclination: v }))} color={params.color} />
          <SliderParam label="RAAN" value={params.raan} min={0} max={360} step={1} unit="°" onChange={v => setParams(p => ({ ...p, raan: v }))} color={params.color} />
          <SliderParam label="Speed" value={params.speed} min={0.01} max={0.4} step={0.01} unit="x" onChange={v => setParams(p => ({ ...p, speed: v }))} color={params.color} />

          {/* Scene Toggles */}
          <div className="mb-5">
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>SCENE OPTIONS</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowLabels(v => !v)}
                data-testid="toggle-labels"
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full"
                style={{ background: showLabels ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${showLabels ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {showLabels ? <Eye size={13} color="#00F0FF" /> : <EyeOff size={13} color="rgba(255,255,255,0.3)" />}
                <span style={{ fontFamily: 'Rajdhani', fontSize: '13px', fontWeight: 600, color: showLabels ? '#00F0FF' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Labels</span>
              </button>
              <button
                onClick={() => setShowGPS(v => !v)}
                data-testid="toggle-gps"
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full"
                style={{ background: showGPS ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${showGPS ? 'rgba(0,255,148,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Satellite size={13} color={showGPS ? '#00FF94' : 'rgba(255,255,255,0.3)'} />
                <span style={{ fontFamily: 'Rajdhani', fontSize: '13px', fontWeight: 600, color: showGPS ? '#00FF94' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GPS Constellation</span>
              </button>
            </div>
          </div>

          {/* Computed Data */}
          <div className="mt-2 mb-6">
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '10px' }}>ORBITAL DATA</p>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {dataRows.map(([label, val], i) => (
                <div key={label} className="flex justify-between px-3 py-2" style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: i < dataRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: params.color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '10px' }}>PRESETS</p>
            <div className="flex flex-wrap gap-2">
              {ORBIT_ORDER.map(id => {
                const o = ORBITS[id];
                const unlocked = isOrbitUnlocked(id);
                return (
                  <button
                    key={id}
                    onClick={() => unlocked && loadPreset(id)}
                    disabled={!unlocked}
                    data-testid={`preset-${id}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontFamily: 'Rajdhani',
                      fontWeight: 600,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: selectedPresetId === id ? '#000' : unlocked ? o.color : 'rgba(255,255,255,0.2)',
                      background: selectedPresetId === id ? o.color : `${o.color}12`,
                      border: `1px solid ${unlocked ? o.color + '40' : 'rgba(255,255,255,0.1)'}`,
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.5,
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    {o.shortName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
