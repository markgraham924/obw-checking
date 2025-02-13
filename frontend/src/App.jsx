import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ObwCompliance from './pages/ObwCompliance';
import AmbientChecker from './pages/AmbientChecker';
import LocationChecker from './pages/LocationChecker';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/obw-compliance" element={<ObwCompliance />} />
        <Route path="/ambient-checker" element={<AmbientChecker />} />
        <Route path="/location-checker" element={<LocationChecker />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
