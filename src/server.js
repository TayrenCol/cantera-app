import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js';
import express from 'express';
import helpData from '../data/helpData.json' assert { type: 'json' };

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();

app.use(express.json());

// Endpoint de verificación del estado del servicio y la base de datos
app.get('/health', async (req, res) => {
  try {
    // Test rápido de consulta a la base de datos MySQL usando el pool
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

// Ruta principal
app.get('/', (req, res) => {
  res.send('API Cantera App ejecutándose correctamente');
});

// Listener de Express (importante escuchar en '0.0.0.0' para Hostinger)
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de Cantera App listo en el puerto ${port}`);
});

// Endpoint público para obtener las guías de ayuda
router.get('/api/help', (req, res) => {
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

export default router;