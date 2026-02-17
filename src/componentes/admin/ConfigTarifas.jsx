import React, { useState, useEffect } from "react";
import styles from "../../estilos/admin.module.css";
import { 
  MdAttachMoney, 
  MdDirectionsCar, 
  MdTwoWheeler, 
  MdAccessTime, 
  MdSave,
  MdSettingsSuggest,
  MdLocalShipping 
} from "react-icons/md";

export default function ConfigTarifas() {
  // Simplificamos el estado: ahora solo nos interesa el minuto
  const [tarifas, setTarifas] = useState({
    moto: { minuto: 0 },
    livianos: { minuto: 0 },
    otros: { minuto: 0 }
  });

  const cargarTarifas = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/admin/tarifas");
      if (res.ok) {
        const data = await res.json();
        const nuevasTarifas = { ...tarifas };
        
        Object.keys(data).forEach(tipo => {
          if (nuevasTarifas[tipo]) {
            nuevasTarifas[tipo] = { 
              minuto: data[tipo].minuto || 0 
            };
          }
        });
        setTarifas(nuevasTarifas);
      }
    } catch (error) {
      console.error("Error al cargar tarifas:", error);
    }
  };

  useEffect(() => {
    cargarTarifas();
  }, []);

  const actualizarEstadoLocal = (tipo, valor) => {
    setTarifas({
      ...tarifas,
      [tipo]: { minuto: Number(valor) }
    });
  };

    const guardarTarifa = async (tipo) => {
  try {
    // Primero obtener capacidad actual
    const resGet = await fetch(`http://localhost:3001/api/admin/tarifas`);
    const tarifasActuales = await resGet.json();
    
    const capacidadActual = tarifasActuales[tipo]?.capacidad || 100;
    
    const res = await fetch(`http://localhost:3001/api/admin/tarifas/${tipo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo_vehiculo: tipo,
        valor_hora: tarifas[tipo].minuto * 60,
        capacidad: capacidadActual
      })
    });

    if (res.ok) {
      alert(`Tarifa de ${tipo} actualizada a $${tarifas[tipo].minuto}/min.`);
    } else {
      const errorData = await res.json();
      alert("Error al guardar: " + errorData.error);
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("No se pudo conectar con el servidor maestro.");
  }
};

  const getIcon = (tipo) => {
    if (tipo === "moto") return <MdTwoWheeler size={32} color="#2563eb" />;
    if (tipo === "livianos") return <MdDirectionsCar size={32} color="#2563eb" />;
    return <MdLocalShipping size={32} color="#2563eb" />;
  };

  return (
    <div className={styles.containerCapacidades}>
      <header className={styles.headerCapacidades}>
        <MdSettingsSuggest size={30} color="#1e293b" />
        <h2>Configuración de Tarifas</h2>
      </header>
      
      <p className={styles.descripcionCapacidades}>
        Defina el precio por <strong>minuto</strong>. El sistema calculará el total basado en el tiempo exacto de estancia.
      </p>

      <div className={styles.gridCapacidades}>
        {Object.keys(tarifas).map((tipo) => (
          <div key={tipo} className={styles.cardCapacidad}>
            <div className={styles.iconZone}>
              {getIcon(tipo)}
            </div>
            
            <h3 style={{ textTransform: 'capitalize', marginBottom: '15px' }}>{tipo}</h3>

            <div style={{ width: '100%' }}>
              <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <MdAttachMoney /> Valor por Minuto ($)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className={styles.inputField}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    borderRadius: '8px', 
                    border: '2px solid #e2e8f0',
                    textAlign: 'center'
                  }}
                  value={tarifas[tipo].minuto} 
                  onChange={(e) => actualizarEstadoLocal(tipo, e.target.value)} 
                />
              </div>
            </div>

            <button 
              className={styles.btnSave}
              style={{ 
                marginTop: '20px', 
                width: '100%', 
                padding: '12px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                fontSize: '1rem'
              }}
              onClick={() => guardarTarifa(tipo)}
            >
              <MdSave size={20} /> Guardar {tipo}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}