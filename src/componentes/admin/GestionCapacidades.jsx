import React, { useState, useEffect } from "react";
import { FaSave, FaCogs, FaCar, FaMotorcycle, FaTruck } from 'react-icons/fa';
import styles from "../../estilos/admin.module.css";

export default function GestionCapacidades() {
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);
  const [nuevaCapacidad, setNuevaCapacidad] = useState("");

  const API_CENTRAL = "http://127.0.0.1:3001/api/admin";

  const cargarConfiguracion = async () => {
    try {
      const resp = await fetch(`${API_CENTRAL}/tarifas`);
      if (resp.ok) {
        const data = await resp.json();
        // Conversión del objeto { moto: {capacidad: 100}, ... } a array para el map
        const lista = Object.keys(data).map(id => ({
          id,
          nombre: id,
          capacidad: data[id].capacidad || 100
        }));
        setCategorias(lista);
      }
    } catch (error) {
      console.error("Error al cargar capacidades:", error);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const guardarCambio = async (id) => {
    if (!nuevaCapacidad || nuevaCapacidad < 1) {
      alert("Ingrese una capacidad válida.");
      return;
    }

    try {
      const resp = await fetch(`${API_CENTRAL}/actualizar-capacidad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, capacidad: parseInt(nuevaCapacidad) })
      });

      if (resp.ok) {
        setEditando(null);
        cargarConfiguracion();
      }
    } catch (error) {
      alert("Error al conectar con el servidor central.");
    }
  };

  const getIcon = (nombre) => {
    const n = nombre.toLowerCase();
    if (n.includes("moto")) return <FaMotorcycle />;
    if (n.includes("liviano") || n.includes("carro") || n.includes("pequeño")) return <FaCar />;
    return <FaTruck />;
  };

  return (
    <div className={styles.containerCapacidades}>
      <header className={styles.headerCapacidades}>
        <FaCogs size={30} />
        <h2>Gestión de Puestos y Capacidades</h2>
      </header>
      
      <p className={styles.descripcionCapacidades}>
        Ajuste el límite de vehículos permitidos por sección. Estos cambios se sincronizarán con la portería automáticamente.
      </p>

      <div className={styles.gridCapacidades}>
        {categorias.length > 0 ? (
          categorias.map((cat) => (
            <div key={cat.id} className={styles.cardCapacidad}>
              <div className={styles.iconZone}>
                {getIcon(cat.nombre)}
              </div>
              
              <h3 style={{ textTransform: 'capitalize' }}>{cat.nombre}</h3>
              
              {editando === cat.id ? (
                <div className={styles.editBox}>
                  <input 
                    type="number" 
                    value={nuevaCapacidad} 
                    onChange={(e) => setNuevaCapacidad(e.target.value)}
                    placeholder="Cant."
                    autoFocus
                  />
                  <button 
                    onClick={() => guardarCambio(cat.id)} 
                    className={styles.btnSave}
                    title="Guardar"
                  >
                    <FaSave />
                  </button>
                </div>
              ) : (
                <>
                  <span className={styles.valorCapacidad}>
                    {cat.capacidad} <span>puestos</span>
                  </span>
                  <button 
                    onClick={() => { 
                      setEditando(cat.id); 
                      setNuevaCapacidad(cat.capacidad); 
                    }} 
                    className={styles.btnEdit}
                  >
                    Cambiar Cupo
                  </button>
                </>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px', color: '#64748b' }}>
            <p>No hay categorías configuradas. Por favor, agregue tarifas primero.</p>
          </div>
        )}
      </div>
    </div>
  );
}