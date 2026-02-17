import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Variable global para la ventana principal
let mainWindow = null
let folderRespaldo = null

// Configuración del servidor Express
const server = express()
const PORT_MASTER = 3001

server.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))
server.use(express.json())

// --- CONFIGURACIÓN DE ALMACENAMIENTO (FOTOS) ---


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, folderRespaldo),
  filename: (req, file, cb) => cb(null, file.originalname)
})
const upload = multer({ storage: storage })

// --- BASE DE DATOS (better-sqlite3) ---
let db = null

function initDatabase() {
  try {
    // Crear carpeta respaldo
    folderRespaldo = app.isPackaged
      ? path.join(app.getPath('userData'), 'respaldo_seguridad')
      : path.join(__dirname, 'respaldo_seguridad')
    
    if (!fs.existsSync(folderRespaldo)) {
      fs.mkdirSync(folderRespaldo, { recursive: true })
    }

    const dbPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'maestra_parqueadero.sqlite')
      : path.join(__dirname, 'maestra_parqueadero.sqlite')
    
    // resto del código...

    console.log('📂 Ruta de la base de datos:', dbPath)
    db = new Database(dbPath, { verbose: console.log })
    db.pragma('foreign_keys = ON')

    // Crear tablas
    db.exec(`CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY, nombre TEXT, usuario TEXT UNIQUE, password TEXT, rol TEXT, estado INTEGER DEFAULT 1
    )`)

    db.exec(`CREATE TABLE IF NOT EXISTS tarifas (
      id TEXT PRIMARY KEY, 
      tipo_vehiculo TEXT UNIQUE, 
      valor_hora REAL, 
      valor_minuto REAL,
      capacidad INTEGER DEFAULT 100
    )`)

    db.exec(`CREATE TABLE IF NOT EXISTS eventos_seguridad (
      id TEXT PRIMARY KEY, camara_id TEXT, tipo_evento TEXT, timestamp DATETIME, foto_path TEXT
    )`)

    db.exec(`CREATE TABLE IF NOT EXISTS historial_global (
      id TEXT PRIMARY KEY,
      placa TEXT,
      tipo_vehiculo TEXT,
      entrada DATETIME,
      salida DATETIME,
      total_pagado REAL,
      metodo_pago TEXT,
      usuario_nombre TEXT,
      facturo TEXT,
      duracion_minutos INTEGER,
      porteria_id TEXT
    )`)

    db.exec(`CREATE TABLE IF NOT EXISTS reportes_caja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      porteria_turno_id INTEGER,
      usuario_nombre TEXT,
      hora_apertura DATETIME,
      hora_cierre DATETIME,
      base_inicial REAL,
      total_efectivo_sistema REAL,
      total_digital_sistema REAL,
      total_efectivo_reportado REAL,
      total_digital_reportado REAL,
      observaciones TEXT
    )`)

    db.exec(`CREATE TABLE IF NOT EXISTS estado_patio_live (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      ingresos_hoy_reales REAL DEFAULT 0,
      ocupacion_total INTEGER DEFAULT 0,
      detalle_ocupacion_json TEXT DEFAULT '{}',
      ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)

    db.exec(`INSERT OR IGNORE INTO estado_patio_live (id, ingresos_hoy_reales, ocupacion_total, detalle_ocupacion_json) VALUES (1, 0, 0, '{}')`)

    db.exec(`CREATE TABLE IF NOT EXISTS alertas_maestras (
      id TEXT PRIMARY KEY,
      camara_id TEXT,
      tipo TEXT,
      descripcion TEXT,
      archivo_url TEXT,
      fecha TEXT,
      sincronizado_el DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)

    // Crear usuario admin por defecto
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync('admin123', salt)
    const stmt = db.prepare(`INSERT OR IGNORE INTO usuarios (id, nombre, usuario, password, rol) VALUES (?, ?, ?, ?, ?)`)
    stmt.run(uuidv4(), 'Administrador', 'admin', hash, 'Admin')

    console.log('✅ Base de datos inicializada correctamente')
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error)
  }
}

// --- ENDPOINTS DE AUTENTICACIÓN ---
server.post('/api/auth/login', async (req, res) => {
  const { usuario, password } = req.body
  console.log(`[AUTH] Intento de login: ${usuario}`)

  try {
    const user = db.prepare(`SELECT * FROM usuarios WHERE usuario = ? AND estado = 1`).get(usuario)

    if (!user) {
      console.log(`[AUTH] ❌ Usuario no encontrado: ${usuario}`)
      return res.status(401).json({ success: false, error: "Usuario no encontrado" })
    }

    const match = await bcrypt.compare(password, user.password)

    if (match) {
      console.log(`[AUTH] ✅ Login exitoso: ${usuario} (Rol: ${user.rol})`)
      res.json({
        success: true,
        usuario: {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre,
          rol: user.rol
        },
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
      })
    } else {
      console.log(`[AUTH] ❌ Contraseña incorrecta para: ${usuario}`)
      res.status(401).json({ success: false, error: "Contraseña incorrecta" })
    }
  } catch (error) {
    console.error("[AUTH] Error validando contraseña:", error)
    res.status(500).json({ success: false, error: "Error de validación" })
  }
})

// --- CRUD DE USUARIOS ---
server.get('/api/admin/usuarios', (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, nombre, usuario, rol, password, estado FROM usuarios`).all()
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.get('/api/admin/usuarios-seguridad', (req, res) => {
  console.log(`[SYNC] 📡 Solicitud de sincronización de usuarios de seguridad`)
  try {
    const rows = db.prepare(`SELECT id, nombre, usuario, password, rol 
                             FROM usuarios 
                             WHERE (LOWER(rol) = 'guardia' OR LOWER(rol) = 'seguridad') 
                             AND estado = 1`).all()
    console.log(`[SYNC] ✅ Enviando ${rows.length} usuarios de seguridad`)
    res.json({ usuarios: rows })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.post('/api/admin/usuarios', async (req, res) => {
  const { nombre, usuario, password, rol } = req.body
  try {
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(password, salt)
    const id = uuidv4()
    db.prepare(`INSERT INTO usuarios (id, nombre, usuario, password, rol, estado) VALUES (?, ?, ?, ?, ?, 1)`)
      .run(id, nombre, usuario, hash, rol)
    res.json({ mensaje: "Usuario creado" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.put('/api/admin/usuarios/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, usuario, password, rol, estado } = req.body
  try {
    if (password) {
      const salt = bcrypt.genSaltSync(10)
      const hash = bcrypt.hashSync(password, salt)
      db.prepare(`UPDATE usuarios SET nombre=?, usuario=?, password=?, rol=?, estado=? WHERE id=?`)
        .run(nombre, usuario, hash, rol, estado, id)
    } else {
      db.prepare(`UPDATE usuarios SET nombre=?, usuario=?, rol=?, estado=? WHERE id=?`)
        .run(nombre, usuario, rol, estado, id)
    }
    res.json({ mensaje: "Usuario actualizado" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.delete('/api/admin/usuarios/:id', (req, res) => {
  const { id } = req.params
  try {
    db.prepare(`DELETE FROM usuarios WHERE id=?`).run(id)
    res.json({ mensaje: "Usuario eliminado" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- CRUD DE TARIFAS ---
server.get('/api/admin/tarifas', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM tarifas`).all()
    const tarifasObj = {}
    rows.forEach(t => {
      tarifasObj[t.id] = {
        minuto: t.valor_minuto,
        hora: t.valor_hora,
        capacidad: t.capacidad_max
      }
    })
    res.json(tarifasObj)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.post('/api/admin/tarifas', (req, res) => {
  const { tipo_vehiculo, valor_hora, capacidad } = req.body
  const valor_minuto = (valor_hora / 60).toFixed(2)
  try {
    const id = uuidv4()
    db.prepare(`INSERT INTO tarifas (id, tipo_vehiculo, valor_hora, valor_minuto, capacidad) VALUES (?, ?, ?, ?, ?)`)
      .run(id, tipo_vehiculo, valor_hora, valor_minuto, capacidad)
    res.json({ mensaje: "Tarifa creada" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.put('/api/admin/tarifas/:id', (req, res) => {
  const { id } = req.params
  const { tipo_vehiculo, valor_hora, capacidad } = req.body
  const valor_minuto = (valor_hora / 60).toFixed(2)
  try {
    db.prepare(`INSERT OR REPLACE INTO tarifas (id, tipo_vehiculo, valor_hora, valor_minuto, capacidad) 
                VALUES (?, ?, ?, ?, ?)`)
      .run(id, tipo_vehiculo, valor_hora, valor_minuto, capacidad)
    res.json({ mensaje: "Tarifa actualizada" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.delete('/api/admin/tarifas/:id', (req, res) => {
  const { id } = req.params
  try {
    db.prepare(`DELETE FROM tarifas WHERE id=?`).run(id)
    res.json({ mensaje: "Tarifa eliminada" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- HISTORIAL Y REPORTES ---
server.get('/api/admin/historial-global', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM historial_global ORDER BY entrada DESC LIMIT 100`).all()
    res.json(rows || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.get('/api/admin/reportes-caja', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM reportes_caja ORDER BY hora_cierre DESC`).all()
    res.json(rows || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- SINCRONIZACIÓN DESDE PORTERÍA ---
server.post('/api/maestra/sincronizar-movimiento', (req, res) => {
  const { 
    id, placa, tipo_vehiculo, entrada, salida, 
    total_pagado, metodo_pago, usuario_nombre, 
    duracion_minutos, porteria_id 
  } = req.body

  console.log(`[SINCRO] Recibido: ID=${id}, Placa=${placa}, Salida=${salida ? 'SÍ' : 'NO'}, Usuario=${usuario_nombre}`)

  try {
    const registroExistente = db.prepare(`SELECT * FROM historial_global WHERE id = ?`).get(id)

    if (!registroExistente) {
      db.prepare(`INSERT INTO historial_global 
        (id, placa, tipo_vehiculo, entrada, salida, total_pagado, metodo_pago, usuario_nombre, facturo, duracion_minutos, porteria_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`)
        .run(id, placa, tipo_vehiculo, entrada, salida, total_pagado, metodo_pago, usuario_nombre, duracion_minutos, porteria_id)
      
      console.log(`[SINCRO] ✓ ENTRADA registrada - ID: ${id}, Atendió: ${usuario_nombre}`)
      res.json({ status: "OK", mensaje: "Entrada registrada" })
    } else {
      db.prepare(`UPDATE historial_global SET 
        salida = ?,
        total_pagado = ?,
        metodo_pago = ?,
        duracion_minutos = ?,
        facturo = ?
        WHERE id = ?`)
        .run(salida, total_pagado, metodo_pago, duracion_minutos, usuario_nombre, id)
      
      console.log(`[SINCRO] ✓ SALIDA registrada - ID: ${id}, Facturó: ${usuario_nombre}`)
      res.json({ status: "OK", mensaje: "Salida registrada" })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.post('/api/maestra/actualizar-estado-patio', (req, res) => {
  const { ingresos_hoy, ocupacion_total, detalle_ocupacion } = req.body
  const jsonDetalle = JSON.stringify(detalle_ocupacion)
  
  try {
    db.prepare(`UPDATE estado_patio_live SET 
      ingresos_hoy_reales = ?, 
      ocupacion_total = ?, 
      detalle_ocupacion_json = ?, 
      ultima_actualizacion = datetime('now','localtime') 
      WHERE id = 1`)
      .run(ingresos_hoy, ocupacion_total, jsonDetalle)
    
    res.json({ status: "OK" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

server.post('/api/maestra/reportar-cierre', (req, res) => {
  const {
    porteria_turno_id, usuario_nombre, hora_apertura, hora_cierre,
    base_inicial, total_efectivo_sistema, total_digital_sistema,
    total_efectivo_reportado, total_digital_reportado, observaciones
  } = req.body

  try {
    db.prepare(`INSERT INTO reportes_caja 
      (porteria_turno_id, usuario_nombre, hora_apertura, hora_cierre, base_inicial, 
       total_efectivo_sistema, total_digital_sistema, total_efectivo_reportado, 
       total_digital_reportado, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(porteria_turno_id, usuario_nombre, hora_apertura, hora_cierre,
           base_inicial, total_efectivo_sistema, total_digital_sistema,
           total_efectivo_reportado, total_digital_reportado, observaciones)
    
    res.json({ status: "OK", mensaje: "Arqueo de caja recibido en central" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- ALERTAS DE SEGURIDAD ---
server.post('/api/central/recibir-alerta', upload.single('foto'), (req, res) => {
  const { id, camara_id, tipo, descripcion, fecha } = req.body
  const archivo_url = `/respaldo_seguridad/${req.file.filename}`

  try {
    db.prepare(`INSERT OR REPLACE INTO alertas_maestras (id, camara_id, tipo, descripcion, archivo_url, fecha)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, camara_id, tipo, descripcion, archivo_url, fecha)
    
    res.json({ status: "OK", mensaje: "Alerta sincronizada en central" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})



server.get('/api/central/alertas', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM alertas_maestras ORDER BY fecha DESC LIMIT 50").all()
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- RESUMEN DEL DASHBOARD ---
server.get('/api/admin/resumen-hoy', (req, res) => {
  try {
    const rowAlertas = db.prepare("SELECT COUNT(*) as total FROM alertas_maestras WHERE date(fecha) = date('now')").get()
    const estadoPatio = db.prepare("SELECT * FROM estado_patio_live WHERE id = 1").get()

    let detallesOcupacion = {}
    try {
      detallesOcupacion = estadoPatio?.detalle_ocupacion_json 
        ? JSON.parse(estadoPatio.detalle_ocupacion_json) 
        : {}
    } catch (e) {
      console.error("Error parseando detalle_ocupacion_json:", e)
    }

    res.json({
      ingresosHoy: estadoPatio?.ingresos_hoy_reales || 0,
      ocupacionTotal: estadoPatio?.ocupacion_total || 0,
      alertasPendientes: rowAlertas ? rowAlertas.total : 0,
      detallesOcupacion: detallesOcupacion
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- ARRANQUE DEL SERVIDOR ---
function startServer() {
  server.use('/respaldo_seguridad', express.static(folderRespaldo))
  server.listen(PORT_MASTER, '0.0.0.0', () => {
    console.log(`[SERVIDOR MAESTRO] Activo en puerto ${PORT_MASTER}`)
    console.log(`📁 Sirviendo fotos desde: ${folderRespaldo}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // En desarrollo, carga desde Vite dev server
 if (!app.isPackaged) {
  mainWindow.loadURL('http://localhost:5174')
  mainWindow.webContents.openDevTools()
} else {
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  mainWindow.webContents.openDevTools()
}

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Cuando Electron esté listo
app.whenReady().then(() => {
  initDatabase()
  startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Cerrar cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Manejadores IPC (si los necesitas)
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
