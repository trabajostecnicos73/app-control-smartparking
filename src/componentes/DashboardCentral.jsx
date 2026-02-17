import React, { useState, useEffect } from "react";
import VisorAlertas from "./monitoreo/VisorAlertas"; 
import styles from "../estilos/admin.module.css";
// Iconos para una interfaz más intuitiva
import { MdAttachMoney, MdDirectionsCar, MdNotificationsActive, MdComputer, MdRefresh, MdHistory } from "react-icons/md";
import { FaCircle } from "react-icons/fa";

export default function DashboardCentral() {
  const [resumen, setResumen] = useState({
    ingresosHoy: 0,
    ocupacionTotal: 0,
    alertasPendientes: 0,
    detallesOcupacion: {} // Ejemplo: { moto: { actual: 5, max: 50 }, livianos: { actual: 12, max: 80 } }
  });
  const [loading, setLoading] = useState(true);

  const cargarDatosMaestros = async () => {
    try {
      const resp = await fetch("http://localhost:3001/api/admin/resumen-hoy");
      if (resp.ok) {
        const data = await resp.json();
        setResumen(data);
      }
    } catch (error) {
      console.error("Error al conectar con el Servidor Maestro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosMaestros();
    // Auto-actualización cada 60 segundos
    const interval = setInterval(cargarDatosMaestros, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.containerDashboard}>
      <header className={styles.headerDashboard}>
        <div className={styles.tituloSeccion}>
          <MdComputer size={28} />
          <h2>Panel de Control Global</h2>
        </div>
        <button onClick={cargarDatosMaestros} className={styles.btnRefresh} title="Actualizar ahora">
          <MdRefresh size={20} /> {loading ? "Cargando..." : "Refrescar"}
        </button>
      </header>

      {/* 1. INDICADORES CLAVE (KPIs) */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <MdAttachMoney size={30} color="#16a34a" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Ingresos Estimados</span>
            <h3 className={styles.statValue}>$ {resumen.ingresosHoy.toLocaleString()}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
            <MdDirectionsCar size={30} color="#2563eb" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Vehículos en Patio</span>
            <h3 className={styles.statValue}>{resumen.ocupacionTotal} vehículos</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2' }}>
            <MdNotificationsActive size={30} color="#dc2626" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Alertas de Seguridad</span>
            <h3 className={styles.statValue}>{resumen.alertasPendientes} hoy</h3>
          </div>
        </div>
      </div>

      {/* 2. ÁREA DE MONITOREO Y ESTADO */}
      <div className={styles.mainContentGrid}>
        
        {/* COLUMNA IZQUIERDA: SEGURIDAD */}
        <div className={styles.panelAlertas}>
          <div className={styles.panelHeader}>
            <h4><MdNotificationsActive /> Evidencias de Seguridad</h4>
            <span className={styles.badgeLive}>EN VIVO</span>
          </div>
          <VisorAlertas /> 
        </div>
        
        {/* COLUMNA DERECHA: ESTADO DE INFRAESTRUCTURA */}
        <div className={styles.panelControl}>
          
          {/* Gráficas de Ocupación por Zonas */}
          <div className={styles.seccionOcupacion}>
            <h4><MdDirectionsCar /> Estado de Zonas</h4>
            {Object.keys(resumen.detallesOcupacion).length > 0 ? (
              Object.keys(resumen.detallesOcupacion).map(cat => {
                const { actual, max } = resumen.detallesOcupacion[cat];
                const porcentaje = Math.min((actual / max) * 100, 100);
                return (
                  <div key={cat} className={styles.zonaProgress}>
                    <div className={styles.zonaInfo}>
                      <span className={styles.zonaName}>{cat.toUpperCase()}</span>
                      <span className={styles.zonaCount}>{actual} / {max}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${porcentaje}%`,
                          backgroundColor: porcentaje > 85 ? '#ef4444' : '#3b82f6'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.emptyMsg}>Configure tarifas para ver las zonas.</p>
            )}
          </div>

          {/* Estado de las Terminales (PCs) */}
          <div className={styles.seccionTerminals}>
            <h4><MdComputer /> Terminales Conectadas</h4>
            <div className={styles.terminalList}>
              <div className={styles.terminalItem}>
                <div className={styles.terminalLabel}>
                  <MdComputer /> <span>Portería (Ingresos)</span>
                </div>
                <span className={styles.statusOnline}><FaCircle size={8} /> Activa</span>
              </div>
              <div className={styles.terminalItem}>
                <div className={styles.terminalLabel}>
                  <MdComputer /> <span>NVR (Cámaras)</span>
                </div>
                <span className={styles.statusOnline}><FaCircle size={8} /> Activa</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}