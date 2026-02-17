import React, { useState, useEffect } from "react";
import styles from "../../estilos/admin.module.css";
import { MdSecurity, MdHistory, MdPhotoCamera, MdSearch, MdEvent, MdRefresh } from "react-icons/md";

export default function VisorAlertas() {
  const [todasLasAlertas, setTodasLasAlertas] = useState([]);
  const [alertasFiltradas, setAlertasFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroCamara, setFiltroCamara] = useState("");

  const API_URL = "http://localhost:3001/api/central/alertas";
  const FOTOS_URL = "http://localhost:3001"; 

  const cargarAlertas = () => {
    setCargando(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setTodasLasAlertas(data);
        setAlertasFiltradas(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setCargando(false);
      });
  };

  // Filtrado robusto con objetos Date
  useEffect(() => {
    const filtrado = todasLasAlertas.filter(alerta => {
      // Validar que existe fecha
      if (!alerta.fecha) return false;

      // Convertir fecha del servidor a objeto Date
      const fechaAlerta = new Date(alerta.fecha);
      
      // Si hay filtro de fecha, comparar solo año-mes-día
      let coincideFecha = true;
      if (filtroFecha) {
        const [añoFiltro, mesFiltro, diaFiltro] = filtroFecha.split('-').map(Number);
        coincideFecha = 
          fechaAlerta.getFullYear() === añoFiltro &&
          fechaAlerta.getMonth() === mesFiltro - 1 && // Mes en Date es 0-11
          fechaAlerta.getDate() === diaFiltro;
      }
      
      // Filtro de cámara
      const coincideCamara = filtroCamara 
        ? alerta.camara_id.toLowerCase().includes(filtroCamara.toLowerCase()) 
        : true;

      return coincideFecha && coincideCamara;
    });

    setAlertasFiltradas(filtrado);
  }, [filtroFecha, filtroCamara, todasLasAlertas]);

  useEffect(() => { cargarAlertas(); }, []);

  const estiloBarra = {
    display: 'flex',
    gap: '15px',
    padding: '20px',
    background: '#fff',
    borderRadius: '10px',
    marginBottom: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  };

  return (
    <div className={styles.visorContenedorPrincipal} style={{ padding: '20px' }}>
      
      <div style={estiloBarra}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ddd', padding: '8px', borderRadius: '5px' }}>
          <MdEvent color="#666" />
          <input 
            type="date" 
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ddd', padding: '8px', borderRadius: '5px', flex: 1 }}>
          <MdSearch color="#666" />
          <input 
            type="text" 
            placeholder="Buscar por ID de Cámara..." 
            value={filtroCamara}
            onChange={(e) => setFiltroCamara(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
          />
        </div>

        <button onClick={cargarAlertas} className={styles.btnAccionPrimary} style={{ padding: '10px 20px' }}>
          <MdRefresh /> {cargando ? "..." : "Refrescar"}
        </button>
      </div>

      <div className={styles.gridEvidencias}>
        {alertasFiltradas.map((alerta) => (
          <div key={alerta.id} className={styles.tarjetaEvidencia}>
            <div className={styles.headerEvidencia}>
              <span className={styles.tagEvento}>{alerta.tipo || "ALERTA"}</span>
              <span className={styles.fechaEvidencia}>
                {new Date(alerta.fecha).toLocaleString()}
              </span>
            </div>
            
            <div className={styles.contenedorFoto}>
              <img 
  src={`${FOTOS_URL}${alerta.archivo_url}`} 
  alt="Evidencia" 
  className={styles.fotoMiniatura}
  onClick={() => window.open(`${FOTOS_URL}${alerta.archivo_url}`, '_blank')}
  style={{ cursor: 'pointer' }}
  onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=Sin+Foto"; }}
/>
            </div>
            
            <div className={styles.detallesAlerta}>
              <p><MdPhotoCamera /> <strong>Cámara:</strong> {alerta.camara_id}</p>
              <p><MdHistory /> <strong>ID:</strong> {alerta.id.substring(0, 8)}</p>
            </div>
          </div>
        ))}

        {alertasFiltradas.length === 0 && !cargando && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
            <MdSecurity size={50} color="#ccc" />
            <p>No hay fotos para esta fecha o cámara.</p>
          </div>
        )}
      </div>
    </div>
  );
}