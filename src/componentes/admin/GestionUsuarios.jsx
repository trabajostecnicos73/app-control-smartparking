import React, { useState, useEffect } from "react";
import styles from "../../estilos/admin.module.css";
import { 
  MdPersonAdd, MdPeople, MdBadge, MdVerifiedUser, 
  MdOutlineVpnKey, MdAssignmentInd, MdEdit, MdCancel, MdDelete 
} from "react-icons/md";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "", usuario: "", password: "", rol: "Operador"
  });

  // Usamos la IP 127.0.0.1 para mayor estabilidad en la conexión local
  const API_BASE = "http://127.0.0.1:3001/api/admin/usuarios";

  const cargarUsuarios = () => {
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(err => console.error("Error al cargar empleados:", err));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const prepararEdicion = (u) => {
    setEditandoId(u.id);
    // Cargamos los datos existentes. Password se deja vacío por seguridad/edición opcional.
    setNuevoUsuario({ 
      nombre: u.nombre, 
      usuario: u.usuario, 
      password: "", 
      rol: u.rol || "Operador" 
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoUsuario({ nombre: "", usuario: "", password: "", rol: "Operador" });
  };

  const eliminarUsuario = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
      try {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          alert("Empleado eliminado");
          cargarUsuarios();
        }
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    const url = editandoId ? `${API_BASE}/${editandoId}` : API_BASE;
    const metodo = editandoId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoUsuario)
      });

      if (res.ok) {
        alert(editandoId ? "Empleado actualizado con éxito" : "Empleado registrado con éxito");
        cancelarEdicion();
        cargarUsuarios();
      } else {
        const errorData = await res.json();
        alert("Error: " + (errorData.error || "No se pudo guardar"));
      }
    } catch (err) {
      alert("Error de conexión con el servidor maestro.");
    }
  };

  return (
    <div className={styles.seccionAdmin}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <MdPeople size={32} color="#1e293b" /> Control de Empleados
      </h2>
      
      <form onSubmit={guardarUsuario} className={styles.formulario}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontWeight: 'bold', color: '#64748b' }}>
          {editandoId ? <><MdEdit /> Editando Empleado</> : <><MdPersonAdd /> Registrar Nuevo</>}
        </div>
        
        {/* INPUT NOMBRE */}
        <input 
          type="text" 
          placeholder="Nombre completo" 
          value={nuevoUsuario.nombre} 
          required 
          onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} 
        />
        
        {/* INPUT USUARIO */}
        <input 
          type="text" 
          placeholder="Usuario de acceso" 
          value={nuevoUsuario.usuario} 
          required 
          onChange={(e) => setNuevoUsuario({...nuevoUsuario, usuario: e.target.value})} 
        />
        
        {/* INPUT PASSWORD */}
        <input 
          type="password" 
          placeholder={editandoId ? "Nueva contraseña (opcional)" : "Contraseña"} 
          value={nuevoUsuario.password} 
          required={!editandoId}
          onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} 
        />
        
        {/* SELECT ROL */}
        <select 
          value={nuevoUsuario.rol} 
          onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
        >
          <option value="Operador">Operador (Ingresos)</option>
          <option value="Guardia">Guardia (Seguridad)</option>
          <option value="Admin">Administrador</option>
        </select>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" className={styles.btnLogin}>
            {editandoId ? "Guardar Cambios" : "Registrar Empleado"}
          </button>
          
          {editandoId && (
            <button 
              type="button" 
              onClick={cancelarEdicion} 
              style={{ background: '#94a3b8' }} 
              className={styles.btnLogin}
            >
              <MdCancel /> Cancelar
            </button>
          )}
        </div>
      </form>

      <table className={styles.tabla}>
        <thead>
          <tr>
            <th><MdBadge /> Nombre</th>
            <th><MdVerifiedUser /> Usuario</th>
            <th><MdAssignmentInd /> Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.usuario}</td>
              <td>
                <span className={styles.rolBadge}>{u.rol}</span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <MdEdit 
                    style={{ cursor: 'pointer', color: '#3b82f6' }} 
                    size={22} 
                    onClick={() => prepararEdicion(u)} 
                    title="Editar"
                  />
                  <MdDelete 
                    style={{ cursor: 'pointer', color: '#ef4444' }} 
                    size={22} 
                    onClick={() => eliminarUsuario(u.id, u.nombre)} 
                    title="Eliminar"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {usuarios.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b' }}>
          No hay empleados registrados.
        </p>
      )}
    </div>
  );
}