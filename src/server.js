import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
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

// Middlewares
app.use(cors()); // Habilita peticiones entre dominios (CORS)
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

// 3. Endpoint del Centro de Ayuda (RF-11) con filtrado y búsqueda
app.get('/api/help', (req, res) => {
  try {
    const { q, categoria } = req.query;

    let resultCategories = helpData.categorias;

    // Filtrar por categoría si se proporciona la query
    if (categoria) {
      resultCategories = resultCategories.filter(
        cat => cat.id.toLowerCase() === categoria.toLowerCase()
      );
    }

    // Filtrar por término de búsqueda (q)
    if (q) {
      const searchTerm = q.toLowerCase().trim();

      resultCategories = resultCategories
        .map(cat => {
          const matchingQuestions = cat.preguntas.filter(p => {
            // Coincidencia en el texto de la pregunta
            const matchInQuestion = p.pregunta.toLowerCase().includes(searchTerm);
            
            // Coincidencia en alguno de los pasos/instrucciones del arreglo
            const matchInSteps = Array.isArray(p.pasos) && p.pasos.some(paso => 
              paso.toLowerCase().includes(searchTerm)
            );

            return matchInQuestion || matchInSteps;
          });

          return {
            ...cat,
            preguntas: matchingQuestions
          };
        })
        .filter(cat => cat.preguntas.length > 0); // Oculta categorías sin coincidencias
    }

    res.status(200).json({
      success: true,
      modulo: helpData.modulo,
      version: helpData.version,
      query: { q: q || null, categoria: categoria || null },
      totalCategorias: resultCategories.length,
      data: resultCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al procesar la información del Centro de Ayuda',
      error: error.message
    });
  }
});

// 4. Servidor en escucha
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de Cantera App listo en el puerto ${port}`);
});