const db = require('/app/src/config/database');

// Autenticación
async function registrarUsuario(req, res) {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: "Faltan datos" });
    try {
        const [result] = await db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', [nombre, email, password, rol || 'cliente']);
        res.status(201).json({ mensaje: "Usuario registrado", usuarioId: result.insertId });
    } catch (error) { res.status(500).json({ error: "Error o el correo ya existe" }); }
}

async function loginUsuario(req, res) {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password = ?', [email, password]);
        if (rows.length === 0) return res.status(401).json({ error: "Credenciales incorrectas" });
        res.status(200).json({ mensaje: "Login exitoso", usuario: rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
}

// Servicios
async function crearServicio(req, res) {
    const { nombre, descripcion, precio, duracion_minutos } = req.body;
    try {
        const [result] = await db.query('INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos) VALUES (?, ?, ?, ?)', [nombre, descripcion, precio, duracion_minutos]);
        res.status(201).json({ mensaje: "Servicio creado", servicioId: result.insertId });
    } catch (error) { res.status(500).json({ error: error.message }); }
}

async function listarServicios(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM servicios');
        res.status(200).json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
}

// Citas
async function agendarCita(req, res) {
    const { usuario_id, servicio_id, fecha_hora } = req.body;
    try {
        const [result] = await db.query('INSERT INTO citas (usuario_id, servicio_id, fecha_hora) VALUES (?, ?, ?)', [usuario_id, servicio_id, fecha_hora]);
        res.status(201).json({ mensaje: "Cita agendada", citaId: result.insertId });
    } catch (error) { res.status(500).json({ error: error.message }); }
}

async function listarCitas(req, res) {
    try {
        const [rows] = await db.query('SELECT c.id, u.nombre AS cliente, s.nombre AS servicio, c.fecha_hora FROM citas c JOIN usuarios u ON c.usuario_id = u.id JOIN servicios s ON c.servicio_id = s.id');
        res.status(200).json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
}

module.exports = { registrarUsuario, loginUsuario, crearServicio, listarServicios, agendarCita, listarCitas };