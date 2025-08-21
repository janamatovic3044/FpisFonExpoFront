import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
 import ManagePrijavaPage from './components/ManagePrijavaPage';
import PrijavaDetails from './components/PrijavaDetails';

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegistrationForm />} />
      <Route path="/manage" element={<ManagePrijavaPage />} />
      <Route path="/prijava-details" element={<PrijavaDetails />} />
      </Routes>
  </BrowserRouter>
);

export default App;