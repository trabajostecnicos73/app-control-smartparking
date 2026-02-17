import React, { useState, useEffect } from "react";
import styles from "../../estilos/admin.module.css";
import { 
  MdAssessment, 
  MdSearch, 
  MdCheckCircle, 
  MdError, 
  MdAttachMoney, 
  MdPerson,
  MdRefresh 
} from "react-icons/md";

export default function ReporteCaja() {
  const [turnos, setTurnos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  const cargarReportesCaja = async () => {
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:3001/api/admin/reportes-caja");
      if (resp.ok) {
        const data = await resp.json();
        setTurnos(data);
      }
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportesCaja();
  }, []);

  const turnosFiltrados = turnos.filter(t => 
    t.usuario_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    t.id.toString().includes(filtro)
  );

  return (
    <div className={styles.containerCapacidades}>
      <header className={styles.headerCapacidades}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdAssessment size={30} color="#1e293b" />
          <h2>Reportes de Cierre y Arqueos</h2>
        </div>
        <button onClick={cargarReportesCaja} className={styles.btnEdit}>
          <MdRefresh /> Actualizar
        </button>
      </header>

      <div className={styles.barraHerramientas}>
        <div className={styles.searchBox}>
          <MdSearch size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cajero o ID de turno..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tablaMaestraContenedor}>
        <table className={styles.tablaMaestra}>
          <thead>
            <tr>
              <th>ID Turno</th>
              <th>Cajero</th>
              <th>Apertura / Cierre</th>
              <th>Base</th>
              <th>Recaudo Sistema</th>
              <th>Reportado Cajero</th>
              <th>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8">Cargando arqueos...</td></tr>
            ) : turnosFiltrados.map((t) => {
              const recaudoSistema = t.total_efectivo_sistema + t.total_digital_sistema;
              const recaudoCajero = t.total_efectivo_reportado + t.total_digital_reportado;
              const diferencia = recaudoCajero - recaudoSistema;
              
              return (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td style={{ fontWeight: '600' }}>
                    <MdPerson /> {t.usuario_nombre}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div><b>A:</b> {new Date(t.hora_apertura).toLocaleString()}</div>
                    <div><b>C:</b> {t.hora_cierre ? new Date(t.hora_cierre).toLocaleString() : 'Abierto'}</div>
                  </td>
                  <td>$ {t.base_inicial.toLocaleString()}</td>
                  <td>$ {recaudoSistema.toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold' }}>$ {recaudoCajero.toLocaleString()}</td>
                  <td style={{ 
                    color: diferencia < 0 ? '#ef4444' : diferencia > 0 ? '#10b981' : 'inherit',
                    fontWeight: 'bold'
                  }}>
                    {diferencia === 0 ? "—" : `$ ${diferencia.toLocaleString()}`}
                  </td>
                  <td>
                    {diferencia === 0 ? (
                      <span className={styles.badgeOk}><MdCheckCircle /> Cuadrado</span>
                    ) : (
                      <span className={styles.badgeError}><MdError /> Descuadre</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}