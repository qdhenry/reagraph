import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const linkStyle = (path: string) => ({
    padding: '10px 20px',
    textDecoration: 'none',
    color: location.pathname === path ? '#fff' : '#ddd',
    backgroundColor: location.pathname === path ? '#0066cc' : 'transparent',
    borderRadius: '4px',
    transition: 'all 0.2s'
  });

  return (
    <nav style={{
      backgroundColor: '#1a1a1a',
      padding: '15px 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '20px' }}>
          Reagraph Performance Experiments
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/" style={linkStyle('/')}>Home</Link>
          <Link to="/baseline" style={linkStyle('/baseline')}>Baseline</Link>
          <Link to="/optimized" style={linkStyle('/optimized')}>Optimized</Link>
          <Link to="/compare" style={linkStyle('/compare')}>Compare</Link>
          <Link to="/metrics" style={linkStyle('/metrics')}>Metrics</Link>
        </div>
      </div>
    </nav>
  );
}