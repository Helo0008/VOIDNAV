import { Link, useLocation } from 'react-router-dom';
import { Rocket, BookOpen, Globe, Brain, BarChart3, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useProgress } from '../hooks/useProgress';

const navLinks = [
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/explore', label: 'Explore', icon: Globe },
  { to: '/sandbox', label: 'Sandbox', icon: Rocket },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/dashboard', label: 'Mission Log', icon: BarChart3 },
];

export function Navigation() {
  const location = useLocation();
  const { progress } = useProgress();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      data-testid="navigation"
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{ background: 'rgba(3,3,5,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,240,255,0.1)' }}
    >
      <div className="flex items-center justify-between h-full px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)' }}>
            <Rocket size={16} color="#00F0FF" />
          </div>
          <span className="font-secondary font-bold text-lg tracking-widest uppercase text-white group-hover:text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif', transition: 'color 0.2s' }}>
            Void Nav
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium tracking-wide"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: isActive ? '#00F0FF' : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,240,255,0.2)' : '1px solid transparent',
                  transition: 'color 0.2s, background 0.2s, border-color 0.2s',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Points Display */}
        <div className="flex items-center gap-4">
          <div
            data-testid="points-display"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}
          >
            <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#FFD700' }}>XP</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FFD700', fontSize: '14px', fontWeight: 600 }}>
              {progress.totalPoints.toLocaleString()}
            </span>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)' }}
            data-testid="mobile-menu-toggle"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden absolute left-0 right-0 top-16 py-3 px-4 flex flex-col gap-1"
          style={{ background: 'rgba(3,3,5,0.97)', borderBottom: '1px solid rgba(0,240,255,0.15)' }}
        >
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          <div className="flex items-center gap-2 px-4 py-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: '#FFD700' }}>XP: {progress.totalPoints}</span>
          </div>
        </div>
      )}
    </nav>
  );
}
