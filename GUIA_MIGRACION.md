# 📋 Guía de Migración Paso a Paso

Esta guía te ayudará a migrar tu aplicación existente al nuevo proyecto renovado.

## 🎯 Fase 1: Preparación (1-2 horas)

### 1.1 Instalar dependencias del nuevo proyecto

```bash
cd control-renovado
npm install
```

### 1.2 Probar que el proyecto base funciona

```bash
# Probar en modo desarrollo
npm run dev:electron
```

Deberías ver la ventana de Electron con la página de inicio. Prueba el botón "Ver Ejemplo de Base de Datos" para confirmar que la BD funciona.

### 1.3 Revisar tu proyecto anterior

Abre tu proyecto anterior y organiza mentalmente qué componentes tienes:
- Páginas principales (Login, Dashboard, Reportes, etc.)
- Componentes reutilizables (Botones, Tablas, Formularios, etc.)
- Servicios/utilidades (Funciones helper, formatters, etc.)
- Lógica de base de datos

---

## 🔄 Fase 2: Migración de Base de Datos (2-4 horas)

### 2.1 Comparar esquemas de base de datos

**Tu proyecto anterior:**
Revisa qué tablas tenías en tu base de datos SQLite anterior.

**Proyecto nuevo:**
El archivo `database.js` ya tiene tablas de ejemplo (usuarios, vehiculos, registros).

### 2.2 Adaptar el esquema

Edita `/control-renovado/database.js` en la función `createTables()`:

```javascript
function createTables() {
  // Copia las definiciones de tus tablas aquí
  db.exec(`
    CREATE TABLE IF NOT EXISTS tu_tabla (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campo1 TEXT NOT NULL,
      campo2 INTEGER,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Agrega más tablas según necesites
}
```

### 2.3 Migrar funciones de base de datos

Si tenías funciones específicas en tu proyecto anterior, agrégalas al final de `database.js`:

```javascript
// Ejemplo: función personalizada
export function tuFuncionPersonalizada(parametro) {
  const stmt = db.prepare('SELECT * FROM tu_tabla WHERE campo = ?')
  return stmt.get(parametro)
}
```

### 2.4 Actualizar handlers IPC en main.js

Para cada función nueva que agregues a `database.js`, crea un handler en `main.js`:

```javascript
ipcMain.handle('db:tu-funcion', async (event, parametro) => {
  try {
    const resultado = db.tuFuncionPersonalizada(parametro)
    return { success: true, data: resultado }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

### 2.5 Exponer en preload.js

Agrega la función al objeto expuesto en `preload.js`:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... código existente ...
  
  tuModulo: {
    tuFuncion: (parametro) => 
      ipcRenderer.invoke('db:tu-funcion', parametro)
  }
})
```

### 2.6 Probar la base de datos

Reinicia Electron y prueba llamar tu función desde React:

```javascript
const resultado = await window.electronAPI.tuModulo.tuFuncion(parametro)
console.log(resultado)
```

---

## 🎨 Fase 3: Migración de Componentes React (1-2 semanas)

### 3.1 Crear estructura de carpetas

```bash
mkdir -p src/components
mkdir -p src/pages
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p src/context
mkdir -p src/assets
```

### 3.2 Migrar componentes pequeños primero

**Orden recomendado:**
1. Componentes simples sin dependencias (Botones, Cards, etc.)
2. Componentes con lógica básica (Formularios, Tablas)
3. Páginas completas
4. Componentes complejos con estado global

**Ejemplo de migración de un componente:**

**Antes (CommonJS):**
```javascript
const React = require('react')

function MiBoton({ texto, onClick }) {
  return <button onClick={onClick}>{texto}</button>
}

module.exports = MiBoton
```

**Ahora (ES Modules):**
```javascript
import React from 'react'

function MiBoton({ texto, onClick }) {
  return <button onClick={onClick}>{texto}</button>
}

export default MiBoton
```

### 3.3 Actualizar imports en cada componente

Busca y reemplaza en todos tus archivos:
- `const X = require('X')` → `import X from 'X'`
- `module.exports =` → `export default`
- `exports.X =` → `export const X =`

### 3.4 Migrar llamadas a base de datos

**Antes (con sqlite3):**
```javascript
db.all('SELECT * FROM vehiculos', [], (err, rows) => {
  if (err) {
    console.error(err)
  } else {
    setVehiculos(rows)
  }
})
```

**Ahora (con electronAPI):**
```javascript
const response = await window.electronAPI.vehiculos.obtenerTodos()
if (response.success) {
  setVehiculos(response.data)
} else {
  console.error(response.error)
}
```

### 3.5 Probar cada componente individualmente

Después de migrar cada componente:
1. Importarlo en App.jsx temporalmente
2. Verificar que renderiza correctamente
3. Probar su funcionalidad
4. Continuar con el siguiente

---

## 🚀 Fase 4: Migración de Páginas (3-5 días)

### 4.1 Orden de migración de páginas

1. **Login** (si tienes) - Es la puerta de entrada
2. **Dashboard principal** - Vista general
3. **Páginas de gestión** (CRUD de vehículos, usuarios, etc.)
4. **Páginas de reportes**
5. **Configuraciones**

### 4.2 Ejemplo: Migrar página de Login

**Crea `/src/pages/Login.jsx`:**
```javascript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import bcrypt from 'bcryptjs'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const response = await window.electronAPI.usuarios.obtenerPorUsername(username)
    
    if (response.success && response.data) {
      const usuario = response.data
      const passwordValido = await bcrypt.compare(password, usuario.password)
      
      if (passwordValido) {
        // Guardar sesión (usa localStorage o Context API)
        localStorage.setItem('usuario', JSON.stringify(usuario))
        navigate('/dashboard')
      } else {
        setError('Contraseña incorrecta')
      }
    } else {
      setError('Usuario no encontrado')
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}

export default Login
```

**Agregar ruta en App.jsx:**
```javascript
import Login from './pages/Login'

// En el Router:
<Route path="/login" element={<Login />} />
```

### 4.3 Migrar estilos CSS

Copia tus archivos CSS y ajusta los imports:

```javascript
import './Login.css'  // Asegúrate de que la ruta sea correcta
```

---

## 🔧 Fase 5: Servicios y Utilidades (2-3 días)

### 5.1 Crear servicios reutilizables

**Crea `/src/services/authService.js`:**
```javascript
import bcrypt from 'bcryptjs'

export const authService = {
  login: async (username, password) => {
    const response = await window.electronAPI.usuarios.obtenerPorUsername(username)
    
    if (response.success && response.data) {
      const usuario = response.data
      const passwordValido = await bcrypt.compare(password, usuario.password)
      
      if (passwordValido) {
        return { success: true, usuario }
      }
    }
    return { success: false, error: 'Credenciales inválidas' }
  },
  
  logout: () => {
    localStorage.removeItem('usuario')
  },
  
  getUsuarioActual: () => {
    const usuario = localStorage.getItem('usuario')
    return usuario ? JSON.parse(usuario) : null
  }
}
```

### 5.2 Crear utilidades

**Crea `/src/utils/formatters.js`:**
```javascript
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatearPlaca = (placa) => {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
}
```

---

## 🎯 Fase 6: Rutas y Navegación (1 día)

### 6.1 Configurar todas las rutas en App.jsx

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import Usuarios from './pages/Usuarios'
import Reportes from './pages/Reportes'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehiculos" element={<Vehiculos />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </Router>
  )
}
```

### 6.2 Crear componente de navegación

**Crea `/src/components/Navbar.jsx`:**
```javascript
import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/vehiculos">Vehículos</Link>
      <Link to="/usuarios">Usuarios</Link>
      <Link to="/reportes">Reportes</Link>
    </nav>
  )
}

export default Navbar
```

---

## ✅ Fase 7: Pruebas y Ajustes Finales (2-3 días)

### 7.1 Checklist de pruebas

- [ ] Login funciona correctamente
- [ ] Todas las páginas cargan sin errores
- [ ] Operaciones de base de datos funcionan
- [ ] La navegación entre páginas funciona
- [ ] Los formularios guardan datos
- [ ] Las tablas muestran datos
- [ ] Los estilos se ven correctos
- [ ] No hay errores en la consola

### 7.2 Optimizaciones

```javascript
// Usar React.memo para componentes que no cambian frecuentemente
import { memo } from 'react'

const MiComponente = memo(({ prop1, prop2 }) => {
  // ...
})
```

### 7.3 Manejo de errores global

**Crea `/src/utils/errorHandler.js`:**
```javascript
export const handleError = (error, contexto = '') => {
  console.error(`Error en ${contexto}:`, error)
  
  // Mostrar notificación al usuario
  alert(`Error: ${error.message || 'Ha ocurrido un error'}`)
}
```

---

## 📦 Fase 8: Compilación y Distribución (1 día)

### 8.1 Probar build de producción

```bash
npm run build
npm run dist
```

### 8.2 Verificar el ejecutable

El ejecutable estará en `/dist_electron/`. Pruébalo en tu sistema:
- Windows: `.exe`
- macOS: `.app`
- Linux: `AppImage`

### 8.3 Ajustar configuración de build si es necesario

Edita `package.json` en la sección `"build"` si necesitas:
- Cambiar el icono de la app
- Agregar más archivos al build
- Configurar instalador en lugar de portable

---

## 🆘 Solución de Problemas Comunes

### Error: "Cannot use import statement outside a module"
**Solución:** Asegúrate de que `"type": "module"` esté en package.json

### Error con better-sqlite3
**Solución:**
```bash
npm run postinstall
```

### React no detecta cambios en desarrollo
**Solución:** Reinicia el servidor de desarrollo

### Electron no carga la página
**Solución:** Verifica que Vite esté corriendo en http://localhost:5174

---

## 📊 Progreso Estimado

| Fase | Tiempo Estimado | Complejidad |
|------|----------------|-------------|
| 1. Preparación | 1-2 horas | ⭐ Fácil |
| 2. Base de datos | 2-4 horas | ⭐⭐ Media |
| 3. Componentes | 1-2 semanas | ⭐⭐⭐ Alta |
| 4. Páginas | 3-5 días | ⭐⭐⭐ Alta |
| 5. Servicios | 2-3 días | ⭐⭐ Media |
| 6. Navegación | 1 día | ⭐ Fácil |
| 7. Pruebas | 2-3 días | ⭐⭐ Media |
| 8. Build | 1 día | ⭐ Fácil |

**Total estimado: 2-3 semanas** trabajando de forma constante.

---

## 💡 Consejos Finales

1. **Migra poco a poco** - No intentes hacer todo de una vez
2. **Prueba constantemente** - Cada componente migrado debe funcionar antes de continuar
3. **Usa Git** - Haz commits frecuentes para poder revertir cambios si algo falla
4. **Documenta cambios** - Anota qué funcionaba diferente en la versión anterior
5. **Pide ayuda si te atoras** - Es mejor preguntar que perder horas buscando

¡Éxito con tu migración! 🚀
