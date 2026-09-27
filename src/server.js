import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api/dashboard', dashboardRoutes);

// Endpoint de verificación del estado del servicio
app.get('/health', async (req, res) => {
  try {
    // Test rápido de consulta a la base de datos MySQL
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

// Ruta principal: sirve la vista del dashboard
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Listener de Express (importante escuchar en '0.0.0.0')
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de Cantera App listo en el puerto ${port}`);
});