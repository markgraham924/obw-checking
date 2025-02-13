import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to the App</h1>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/obw-compliance" style={linkStyle}>
          OBW Compliance Page
        </Link>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <Link to="/ambient-checker" style={linkStyle}>
          Ambient Checker
        </Link>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <Link to="/location-checker" style={linkStyle}>
          Location Checker
        </Link>
      </div>
    </div>
  );
};

const linkStyle = {
  display: 'inline-block',
  padding: '1rem 2rem',
  margin: '0.5rem',
  backgroundColor: '#007BFF',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: '4px'
};

export default LandingPage;
