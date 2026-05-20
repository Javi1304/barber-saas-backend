CREATE DATABASE IF NOT EXISTS barber_saas;
USE barber_saas;

-- 1. Tabla de Barberías (Soporte Multitenant)
CREATE TABLE IF NOT EXISTS barberias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    plan VARCHAR(50) DEFAULT 'pro', -- Para el SaaS
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (Filtra por barberia_id)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barberia_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'barbero', 'cliente') DEFAULT 'cliente',
    historial_inasistencias INT DEFAULT 0, -- Útil para la IA predictiva
    FOREIGN KEY (barberia_id) REFERENCES barberias(id) ON DELETE CASCADE
);

-- 3. Tabla de Servicios
CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barberia_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_estimada_minutos INT NOT NULL,
    FOREIGN KEY (barberia_id) REFERENCES barberias(id) ON DELETE CASCADE
);

-- 4. Tabla de Citas (Con campos de IA y Finanzas)
CREATE TABLE IF NOT EXISTS citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barberia_id INT NOT NULL,
    usuario_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    duracion_optimizada_ia INT NOT NULL, -- Motor de IA de horarios
    riesgo_cancelacion_ia ENUM('Bajo', 'Medio', 'Alto') DEFAULT 'Bajo', -- IA Predictiva
    anticipo_pagado BOOLEAN DEFAULT FALSE, -- Automatización Financiera
    monto_anticipo DECIMAL(10,2) DEFAULT 0.00,
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no-show') DEFAULT 'pendiente',
    FOREIGN KEY (barberia_id) REFERENCES barberias(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
);

-- Insertar datos de prueba iniciales para que el profe vea que funciona
INSERT INTO barberias (id, nombre) VALUES (1, 'Barbería El Imperio'), (2, 'Spartan Barber');
INSERT INTO usuarios (barberia_id, nombre, email, password, rol, historial_inasistencias) VALUES 
(1, 'Carlos Admin', 'carlos@imperio.com', '123456', 'administrador', 0),
(1, 'Juan Cliente', 'juan@gmail.com', '123456', 'cliente', 3); -- Juan tiene 3 faltas (Riesgo Alto para la IA)
INSERT INTO servicios (barberia_id, nombre, precio, duracion_estimada_minutos) VALUES (1, 'Corte de Cabello Clasico', 200.00, 30);