CREATE DATABASE IF NOT EXISTS barber_saas;
USE barber_saas;

-- 1. Tabla de Barberías (Soporte Multitenant)
CREATE TABLE IF NOT EXISTS barberias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    plan VARCHAR(50) DEFAULT 'pro', -- Para el SaaS
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (Modificada con USERNAME ÚNICO)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barberia_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL, -- Nombre de usuario único
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
    estado VARCHAR(50) DEFAULT 'confirmada-21',
    FOREIGN KEY (barberia_id) REFERENCES barberias(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
);

-- Insertar datos de prueba iniciales de forma segura (Evita errores si el contenedor se reinicia)
INSERT IGNORE INTO barberias (id, nombre) VALUES 
(1, 'Barbería El Imperio'), 
(2, 'Spartan Barber');

-- Datos semilla ajustados con los nombres de usuario únicos
INSERT IGNORE INTO usuarios (id, barberia_id, nombre, username, email, password, rol, historial_inasistencias) VALUES 
(1, 1, 'Carlos Admin', 'carlos_admin', 'carlos@imperio.com', '123456', 'administrador', 0),
(2, 1, 'Juan Cliente', 'juan_cliente', 'juan@gmail.com', '123456', 'cliente', 3);

INSERT IGNORE INTO servicios (id, barberia_id, nombre, precio, duracion_estimada_minutos) VALUES 
(1, 1, 'Corte de Cabello Clasico', 200.00, 30);