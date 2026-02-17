import React from "react";
import { Link, useLocation } from "react-router-dom";
// Importamos iconos específicos para cada sección
import { 
  MdDashboard, 
  MdPeople, 
  MdAttachMoney, 
  MdAssessment, 
  MdSettings, 
  MdHistory 
} from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa";
import styles from "../../estilos/admin.module.css";

export default function Sidebar({ rol, onLogout }) {
  const location = useLocation();
  
  // Función para verificar si la ruta está activa (incluyendo sub-rutas de dashboard)
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <h2>PARK-CONTROL</h2>
        <span className={styles.rolBadge}>{rol}</span>
      </div>

      <nav className={styles.sidebarNav}>
        <Link 
          to="/dashboard" 
          className={isActive("/dashboard") ? styles.navLinkActive : styles.navLink}
        >
          <MdDashboard /> Dashboard Central
        </Link>

        {rol === "Admin" && (
          <>
            <Link 
              to="/dashboard/usuarios" 
              className={isActive("/dashboard/usuarios") ? styles.navLinkActive : styles.navLink}
            >
              <MdPeople /> Empleados
            </Link>

            <Link 
              to="/dashboard/tarifas" 
              className={isActive("/dashboard/tarifas") ? styles.navLinkActive : styles.navLink}
            >
              <MdAttachMoney /> Tarifas y Precios
            </Link>

            <Link 
              to="/dashboard/capacidades" 
              className={isActive("/dashboard/capacidades") ? styles.navLinkActive : styles.navLink}
            >
              <MdSettings /> Capacidades de Puestos
            </Link>

            {/* --- NUEVO ENLACE: HISTORIAL GLOBAL --- */}
            <Link 
              to="/dashboard/historial" 
              className={isActive("/dashboard/historial") ? styles.navLinkActive : styles.navLink}
            >
              <MdHistory /> Historial Global
            </Link>
          </>
        )}

        <Link 
          to="/dashboard/reportes" 
          className={isActive("/dashboard/reportes") ? styles.navLinkActive : styles.navLink}
        >
          <MdAssessment /> Reportes de Caja
        </Link>
      </nav>

      <button onClick={onLogout} className={styles.btnLogout}>
        <FaSignOutAlt /> Cerrar Sesión
      </button>
    </aside>
  );
}