const { contextBridge, ipcRenderer } = require('electron')

// Expone APIs de forma segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Métodos generales
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // ==================== USUARIOS ====================
  usuarios: {
    crear: (username, password, nombre, rol) => 
      ipcRenderer.invoke('db:crear-usuario', { username, password, nombre, rol }),
    
    obtenerTodos: () => 
      ipcRenderer.invoke('db:obtener-usuarios'),
    
    obtenerPorUsername: (username) => 
      ipcRenderer.invoke('db:obtener-usuario-por-username', username),
    
    actualizar: (id, datos) => 
      ipcRenderer.invoke('db:actualizar-usuario', { id, datos }),
    
    eliminar: (id) => 
      ipcRenderer.invoke('db:eliminar-usuario', id)
  },

  // ==================== VEHÍCULOS ====================
  vehiculos: {
    registrar: (placa, tipo, propietario, telefono) => 
      ipcRenderer.invoke('db:registrar-vehiculo', { placa, tipo, propietario, telefono }),
    
    obtenerTodos: () => 
      ipcRenderer.invoke('db:obtener-vehiculos'),
    
    buscarPorPlaca: (placa) => 
      ipcRenderer.invoke('db:buscar-vehiculo-por-placa', placa)
  },

  // ==================== REGISTROS ====================
  registros: {
    entrada: (vehiculoId, usuarioId, notas = null) => 
      ipcRenderer.invoke('db:registrar-entrada', { vehiculoId, usuarioId, notas }),
    
    salida: (vehiculoId, usuarioId, notas = null) => 
      ipcRenderer.invoke('db:registrar-salida', { vehiculoId, usuarioId, notas }),
    
    obtenerRecientes: (limite = 50) => 
      ipcRenderer.invoke('db:obtener-registros-recientes', limite)
  },

  // ==================== ESTADÍSTICAS ====================
  estadisticas: {
    obtener: () => 
      ipcRenderer.invoke('db:obtener-estadisticas')
  }
})

console.log('✅ Preload script cargado correctamente')
