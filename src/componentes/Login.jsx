import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../estilos/bienvenida.module.css"; 
import logo from "../assets/logo.png";

export default function Login({ onLoginSuccess }) {
  const [datos, setDatos] = useState({ usuario: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      // Usamos la ruta completa definida en el main.cjs: /api/auth/login
      const response = await fetch("http://127.0.0.1:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      // Verificamos si la respuesta es JSON para evitar el error "Unexpected token <"
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("El servidor no respondió con JSON. Verifica que el main.cjs de Control esté corriendo.");
      }

      const resultado = await response.json();

      if (response.ok) {
        // Guardamos la sesión y navegamos al Dashboard
        onLoginSuccess(resultado);
        navigate("/dashboard"); 
      } else {
        // Mostramos el mensaje de error del servidor (Usuario no encontrado / Contraseña incorrecta)
        setError(resultado.error || "Credenciales inválidas");
      }
    } catch (err) {
      console.error("Error de login:", err.message);
      setError("Error: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.bienvenidaContainer}>
      <img src={logo} alt="SmartParking Logo" className={styles.logo} />
      
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px", textAlign: "center" }}>
          <h2 style={{ color: "#1e293b", fontSize: "1.2rem" }}>Panel de Control Maestro</h2>
        </div>

        <input
          className={styles.inputField}
          type="text"
          placeholder="Usuario"
          required
          disabled={cargando}
          value={datos.usuario}
          onChange={(e) => setDatos({ ...datos, usuario: e.target.value })}
        />
        <input
          className={styles.inputField}
          type="password"
          placeholder="Contraseña"
          required
          disabled={cargando}
          value={datos.password}
          onChange={(e) => setDatos({ ...datos, password: e.target.value })}
        />

        {error && (
          <p style={{ 
            color: "#ef4444", 
            fontSize: "0.85rem", 
            backgroundColor: "#fee2e2", 
            padding: "8px", 
            borderRadius: "5px",
            margin: "10px 0" 
          }}>
            {error}
          </p>
        )}

        <button 
          type="submit" 
          className={styles.btnIngresar} 
          disabled={cargando}
          style={{ cursor: cargando ? "not-allowed" : "pointer" }}
        >
          {cargando ? "Verificando..." : "Ingresar al Sistema"}
        </button>
      </form>

      <button 
        className={styles.btnAtras} 
        onClick={() => navigate("/")} 
        disabled={cargando}
      >
        Atrás
      </button>
    </div>
  );
}