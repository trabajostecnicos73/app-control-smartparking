# SmartParking Control - Versión Renovada

Sistema Central de Control y Monitoreo con Electron + React + Vite

## 🚀 Cambios principales vs versión anterior

### Actualizaciones importantes:
- ✅ **Electron 33.3** (antes 28.2) - última versión estable
- ✅ **React 18.3** (antes 18.2) - con mejoras de rendimiento
- ✅ **Vite 6** (antes 5) - build más rápido
- ✅ **ES Modules** en lugar de CommonJS - estándar moderno
- ✅ **better-sqlite3** en lugar de sqlite3 - más rápido y confiable
- ✅ **Seguridad mejorada** - contextIsolation + preload script

### Estructura del proyecto:
```
control-renovado/
├── main.js              # Proceso principal de Electron (ES modules)
├── preload.js           # Script de preload para seguridad
├── vite.config.js       # Configuración de Vite
├── package.json         # Dependencias actualizadas
├── index.html           # Punto de entrada HTML
└── src/
    ├── main.jsx         # Punto de entrada React
    ├── App.jsx          # Componente principal
    ├── App.css
    ├── index.css
    ├── components/      # Tus componentes aquí
    ├── pages/           # Tus páginas aquí
    └── services/        # Lógica de negocio aquí
```

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo (solo Vite)
npm run dev

# Desarrollo con Electron
npm run dev:electron

# Compilar para producción
npm run dist
```

## 🔄 Migración desde tu proyecto anterior

### Paso 1: Copiar tu código React
Copia tus componentes, páginas y servicios desde tu proyecto anterior a:
- `/src/components/` - Componentes reutilizables
- `/src/pages/` - Páginas/vistas completas
- `/src/services/` - Servicios, API calls, lógica de negocio

### Paso 2: Actualizar imports
Cambia de CommonJS a ES modules:

**Antes:**
```javascript
const express = require('express')
module.exports = MiComponente
```

**Ahora:**
```javascript
import express from 'express'
export default MiComponente
```

### Paso 3: Migrar base de datos
Si usabas `sqlite3`, cambia a `better-sqlite3`:

**Antes (sqlite3):**
```javascript
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./database.db')

db.all('SELECT * FROM users', [], (err, rows) => {
  console.log(rows)
})
```

**Ahora (better-sqlite3):**
```javascript
import Database from 'better-sqlite3'
const db = new Database('./database.db')

const rows = db.prepare('SELECT * FROM users').all()
console.log(rows)
```

### Paso 4: Configurar IPC (comunicación Electron-React)
Para llamar funciones de Electron desde React:

**En main.js:**
```javascript
ipcMain.handle('mi-funcion', async (event, data) => {
  // Tu lógica
  return resultado
})
```

**En preload.js:**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  miFuncion: (data) => ipcRenderer.invoke('mi-funcion', data)
})
```

**En tu componente React:**
```javascript
const resultado = await window.electronAPI.miFuncion(data)
```

## 🛠️ Comandos útiles

```bash
# Limpiar caché de node_modules
rm -rf node_modules package-lock.json
npm install

# Ver logs de Electron en desarrollo
# Los verás en la terminal donde ejecutaste npm run dev:electron

# Verificar problemas de dependencias
npm audit
npm audit fix
```

## ⚠️ Notas importantes

1. **No uses `require()`** - usa `import/export`
2. **No accedas a Node.js directamente desde React** - usa el preload script
3. **La base de datos debe inicializarse en main.js**, no en React
4. **Para producción**, asegúrate de que `dist/` esté generado antes de `npm run dist`

## 📝 Próximos pasos

1. Instala las dependencias: `npm install`
2. Prueba en desarrollo: `npm run dev:electron`
3. Migra tus componentes uno por uno
4. Prueba cada funcionalidad antes de continuar
5. Compila cuando todo funcione: `npm run dist`

## 🆘 Solución de problemas comunes

### Error: "Cannot find module"
- Verifica que todos los imports usen ES modules
- Asegúrate de que `"type": "module"` esté en package.json

### La app no carga en Electron
- Verifica que Vite esté corriendo en puerto 5174
- Revisa los logs en la terminal

### Error con sqlite/better-sqlite3
- Ejecuta: `npm run postinstall`
- Verifica que esté en `asarUnpack` en package.json

## 📚 Recursos

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
