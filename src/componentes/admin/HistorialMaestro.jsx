import React, { useState, useEffect } from "react";
import { MdHistory, MdSearch, MdFileDownload, MdFilterList } from "react-icons/md";

export default function HistorialMaestro() {
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  const cargarHistorialGlobal = async () => {
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:3001/api/admin/historial-global");
      if (resp.ok) {
        const data = await resp.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error("Error al cargar historial maestro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorialGlobal();
  }, []);

  const registrosFiltrados = registros.filter(r => 
    r.placa.toUpperCase().includes(filtro.toUpperCase()) ||
    r.usuario_nombre?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        background: '#f8fafc',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdHistory size={30} color="#1e293b" />
          <h2 style={{ margin: 0 }}>Auditoría de Movimientos Global</h2>
        </div>
        <button style={{
          background: '#0f172a',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MdFileDownload /> Exportar Reporte
        </button>
      </header>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '15px',
        background: '#f8fafc',
        borderRadius: '8px'
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <MdSearch size={20} style={{ marginRight: '8px', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Buscar por placa o empleado..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '14px'
            }}
          />
        </div>
        <button style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MdFilterList /> Filtros Avanzados
        </button>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Placa</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Categoría</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Entrada</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Salida</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Duración</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Recaudo</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Atendió (Entrada)</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Facturó (Salida)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Cargando historial global...
                </td>
              </tr>
            ) : registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>
                      {reg.placa}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>{reg.tipo_vehiculo}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {new Date(reg.entrada).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {reg.salida ? new Date(reg.salida).toLocaleString() : (
                      <span style={{ color: '#f59e0b', fontWeight: '500' }}>En patio</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {reg.duracion_minutos ? `${reg.duracion_minutos} min` : "—"}
                  </td>
                  <td style={{ padding: '12px', color: '#16a34a', fontWeight: '600' }}>
                    {reg.total_pagado ? `$ ${reg.total_pagado.toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {reg.usuario_nombre || "Sistema"}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {reg.facturo || (reg.salida ? "Sistema" : "—")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}