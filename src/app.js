const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(express.static('src/public'));

// Configuración de la conexión a la Base de Datos en Docker
const db = mysql.createPool({
    host: process.env.DB_HOST || 'db', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'barber_saas',
    timezone: '-06:00', // Fuerza a MySQL a usar la zona horaria local de México
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // CORREGIDO: Evita que mysql2 convierta los DATETIME en objetos Date de JS desfasados
    typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
            return field.string(); 
        }
        return next();
    }
});

// 1. ENDPOINT: REGISTRO DE USUARIOS
app.post('/api/auth/register', async (req, res) => {
    const { nombre, username, email, password, rol } = req.body;
    if (!nombre || !username || !email || !password || !rol) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    try {
        const [existenteUser] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);
        if (existenteUser.length > 0) {
            return res.status(400).json({ error: "El nombre de usuario ya está en uso. Elige otro." });
        }
        const faltasSimuladas = rol === 'cliente' ? Math.floor(Math.random() * 4) : 0; 
        const [result] = await db.query(
            'INSERT INTO usuarios (barberia_id, nombre, username, email, password, rol, historial_inasistencias) VALUES (1, ?, ?, ?, ?, ?, ?)',
            [nombre, username, email, password, rol, faltasSimuladas]
        );
        res.status(201).json({ mensaje: "Usuario registrado exitosamente", usuarioId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. ENDPOINT: INICIO DE SESIÓN
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Falta usuario o contraseña" });
    try {
        const [rows] = await db.query('SELECT id, nombre, username, email, password, rol FROM usuarios WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: "El nombre de usuario no existe" });
        const usuario = rows[0];
        if (usuario.password !== password) return res.status(401).json({ error: "Contraseña incorrecta" });
        res.status(200).json({ 
            mensaje: "Autenticación exitosa", 
            usuario: { id: usuario.id, nombre: usuario.nombre, username: usuario.username, rol: usuario.rol } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. ENDPOINT: AGENDAR CITA (CON RESTRICCIÓN DE HORA REPETIDA)
app.post('/api/citas', async (req, res) => {
    const { barberia_id, usuario_id, servicio_id, fecha_hora, edad_cliente } = req.body;
    
    if (!fecha_hora || !usuario_id) {
        return res.status(400).json({ error: "Faltan datos clave para agendar la cita." });
    }

    try {
        // RESTRICCIÓN: Verificar si ya existe una cita agendada exactamente a esa misma fecha y hora
        const [citasRepetidas] = await db.query(
            'SELECT id FROM citas WHERE fecha_hora = ? AND estado NOT LIKE "cancelada%"', 
            [fecha_hora]
        );

        if (citasRepetidas.length > 0) {
            return res.status(400).json({ error: "Lo sentimos, esa fecha u hora ya se encuentra reservada. Elige otro horario." });
        }

        const estadoConEdad = `confirmada-${edad_cliente || '21'}`;
        const [result] = await db.query(
            `INSERT INTO citas (barberia_id, usuario_id, servicio_id, fecha_hora, duracion_optimizada_ia, riesgo_cancelacion_ia, monto_anticipo, anticipo_pagado, estado) 
             VALUES (?, ?, ?, ?, 30, 'Bajo', 0.00, 1, ?)`,
            [barberia_id || 1, usuario_id, servicio_id || 1, fecha_hora, estadoConEdad]
        );
        res.status(201).json({ mensaje: "Cita procesada exitosamente", citaId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. ENDPOINT: HISTORIAL EXCLUSIVO DEL CLIENTE LOGUEADO
app.get('/api/cliente/citas/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT c.id, s.nombre AS servicio, c.fecha_hora, c.estado 
             FROM citas c
             LEFT JOIN servicios s ON c.servicio_id = s.id
             WHERE c.usuario_id = ?
             ORDER BY c.fecha_hora DESC`, [usuario_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json([]);
    }
});

// 5. ENDPOINT: VISTA DE LA AGENDA GENERAL PARA EL BARBERO
app.get('/api/barbero/agenda', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT c.id, u.nombre AS cliente, c.fecha_hora, s.nombre AS servicio, c.estado
             FROM citas c 
             LEFT JOIN usuarios u ON c.usuario_id = u.id 
             LEFT JOIN servicios s ON c.servicio_id = s.id
             WHERE c.barberia_id = 1
             ORDER BY c.id DESC`
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(200).json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Corriendo de forma segura en Puerto ${PORT}`));