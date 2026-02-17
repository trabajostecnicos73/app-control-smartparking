import React, { useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Componentes
import Bienvenida from "./componentes/Bienvenida";
import Login from "./componentes/Login";
import Sidebar from "./componentes/layout/Sidebar";
import DashboardCentral from "./componentes/DashboardCentral";
import GestionUsuarios from "./componentes/admin/GestionUsuarios";
import ConfigTarifas from "./componentes/admin/ConfigTarifas";
import ReporteCaja from "./componentes/admin/ReporteCaja";
import GestionCapacidades from "./componentes/admin/GestionCapacidades"; 


// --- NUEVA IMPORTACIÓN DEL HISTORIAL ---
import HistorialMaestro from "./componentes/admin/HistorialMaestro";

function App() {
  const [usuario, setUsuario] = useState(null);

  const handleLogout = () => setUsuario(null);

  return (
    <Router 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}
    >
      <Routes>
        {/* Pantallas de Suite (Centradas) */}
        <Route path="/" element={<Bienvenida />} />
        <Route path="/login" element={<Login onLoginSuccess={(u) => setUsuario(u)} />} />

        {/* Panel Administrativo (Con Sidebar) */}
        <Route 
          path="/dashboard/*" 
          element={
            usuario ? (
              <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
                {/* El Sidebar mostrará el nuevo link si lo añades en su archivo correspondiente */}
                <Sidebar rol={usuario.rol} onLogout={handleLogout} />
                
                <main style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                  <Routes>
                    <Route path="/" element={<DashboardCentral />} />
                    <Route path="usuarios" element={<GestionUsuarios />} />
                    <Route path="tarifas" element={<ConfigTarifas />} />
                    <Route path="capacidades" element={<GestionCapacidades />} />
                    
                    {/* --- NUEVA RUTA PARA HISTORIAL GLOBAL --- */}
                    <Route path="historial" element={<HistorialMaestro />} />
                    
                    <Route path="reportes" element={<ReporteCaja />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
