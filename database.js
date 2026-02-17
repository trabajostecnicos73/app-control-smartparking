import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let db = null

/**
 * Inicializa la base de datos SQLite
 */
export function initDatabase() {
  try {
    // En desarrollo, guarda en la carpeta del proyecto
    // En producción, guarda en userData
    const dbPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'smartparking.db')
      : path.join(__dirname, 'smartparking.db')

    console.log('📂 Ruta de la base de datos:', dbPath)

    db = new Database(dbPath, { verbose: console.log })
    
    // Habilitar foreign keys
    db.pragma('foreign_keys = ON')

    // Crear tablas si no existen
    createTables()

    console.log('✅ Base de datos inicializada correctamente')
    return db
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error)
    throw error
  }
}

/**
 * Crea las tablas necesarias
 */
function createTables() {
  // Tabla de usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabla de vehículos (ejemplo)
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL,
      propietario TEXT,
      telefono TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabla de registros de entrada/salida (ejemplo)
  db.exec(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehiculo_id INTEGER NOT NULL,
      tipo_registro TEXT NOT NULL CHECK(tipo_registro IN ('entrada', 'salida')),
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario_id INTEGER,
      notas TEXT,
      FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `)

  console.log('✅ Tablas creadas/verificadas')
}

/**
 * Obtiene la instancia de la base de datos
 */
export function getDatabase() {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada')
  }
  return db
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
  if (db) {
    db.close()
    console.log('✅ Base de datos cerrada')
  }
}

// ==================== FUNCIONES DE USUARIOS ====================

export function crearUsuario(username, password, nombre, rol) {
  const stmt = db.prepare(`
    INSERT INTO usuarios (username, password, nombre, rol)
    VALUES (?, ?, ?, ?)
  `)
  return stmt.run(username, password, nombre, rol)
}

export function obtenerUsuarioPorUsername(username) {
  const stmt = db.prepare('SELECT * FROM usuarios WHERE username = ?')
  return stmt.get(username)
}

export function obtenerTodosUsuarios() {
  const stmt = db.prepare('SELECT id, username, nombre, rol, activo, creado_en FROM usuarios')
  return stmt.all()
}

export function actualizarUsuario(id, datos) {
  const { nombre, rol, activo } = datos
  const stmt = db.prepare(`
    UPDATE usuarios 
    SET nombre = ?, rol = ?, activo = ?, actualizado_en = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  return stmt.run(nombre, rol, activo, id)
}

export function eliminarUsuario(id) {
  const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?')
  return stmt.run(id)
}

// ==================== FUNCIONES DE VEHÍCULOS ====================

export function registrarVehiculo(placa, tipo, propietario, telefono) {
  const stmt = db.prepare(`
    INSERT INTO vehiculos (placa, tipo, propietario, telefono)
    VALUES (?, ?, ?, ?)
  `)
  return stmt.run(placa, tipo, propietario, telefono)
}

export function obtenerTodosVehiculos() {
  const stmt = db.prepare('SELECT * FROM vehiculos ORDER BY creado_en DESC')
  return stmt.all()
}

export function buscarVehiculoPorPlaca(placa) {
  const stmt = db.prepare('SELECT * FROM vehiculos WHERE placa = ?')
  return stmt.get(placa)
}

// ==================== FUNCIONES DE REGISTROS ====================

export function registrarEntrada(vehiculoId, usuarioId, notas = null) {
  const stmt = db.prepare(`
    INSERT INTO registros (vehiculo_id, tipo_registro, usuario_id, notas)
    VALUES (?, 'entrada', ?, ?)
  `)
  return stmt.run(vehiculoId, usuarioId, notas)
}

export function registrarSalida(vehiculoId, usuarioId, notas = null) {
  const stmt = db.prepare(`
    INSERT INTO registros (vehiculo_id, tipo_registro, usuario_id, notas)
    VALUES (?, 'salida', ?, ?)
  `)
  return stmt.run(vehiculoId, usuarioId, notas)
}

export function obtenerRegistrosRecientes(limite = 50) {
  const stmt = db.prepare(`
    SELECT 
      r.*,
      v.placa,
      v.tipo as tipo_vehiculo,
      u.nombre as usuario_nombre
    FROM registros r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    LEFT JOIN usuarios u ON r.usuario_id = u.id
    ORDER BY r.fecha_hora DESC
    LIMIT ?
  `)
  return stmt.all(limite)
}

export function obtenerEstadisticas() {
  const stats = {}
  
  // Total de vehículos registrados
  stats.totalVehiculos = db.prepare('SELECT COUNT(*) as total FROM vehiculos').get().total
  
  // Total de registros hoy
  stats.registrosHoy = db.prepare(`
    SELECT COUNT(*) as total 
    FROM registros 
    WHERE DATE(fecha_hora) = DATE('now')
  `).get().total
  
  // Vehículos en el parqueadero (más entradas que salidas)
  const entradas = db.prepare(`
    SELECT COUNT(*) as total 
    FROM registros 
    WHERE tipo_registro = 'entrada' 
    AND DATE(fecha_hora) = DATE('now')
  `).get().total
  
  const salidas = db.prepare(`
    SELECT COUNT(*) as total 
    FROM registros 
    WHERE tipo_registro = 'salida' 
    AND DATE(fecha_hora) = DATE('now')
  `).get().total
  
  stats.vehiculosActuales = entradas - salidas
  
  return stats
}
