import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// Cargar el archivo JSON del Centro de Ayuda
const helpDataPath = path.join(__dirname, 'data', 'helpData.json');
const helpData = JSON.parse(fs.readFileSync(helpDataPath, 'utf-8'));

// 1. Ruta principal
app.get('/', (req, res) => {
  res.send('API Cantera App ejecutándose correctamente');
});

// 2. Endpoint de verificación de salud y conexión a MySQL
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ 
      status: 'OK',
      environment: process.env.NODE_ENV || 'not_set',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'No se pudo conectar a la base de datos MySQL',
      error: error.message 
    });
  }
});

// 3. Endpoint público para el Centro de Ayuda (RF-11)
app.get('/api/help', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: helpData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información del Centro de Ayuda'
    });
  }
});

// 4. Servidor en escucha (escuchar en '0.0.0.0' para Hostinger)
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de Cantera App listo en el puerto ${port}`);
});