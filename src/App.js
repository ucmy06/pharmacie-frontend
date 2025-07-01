import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* D’autres routes seront ajoutées ici plus tard */}
      </Routes>
    </Router>
  );
}

export default App;
