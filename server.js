const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const productRoutes = require('./routes/productRoutes');

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Suprimir la advertencia de strictQuery
mongoose.set('strictQuery', false);

// Configuración de CORS más flexible
const corsOptions = {
  origin: [
    'http://localhost:3000',       // Frontend local
    'http://127.0.0.1:3000',       // Otra forma de localhost
    /^https:\/\/.*vercel\.app$/     // Cualquier dominio de Vercel
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware de CORS
app.use(cors(corsOptions));

app.use(express.json());

// Servir archivos estáticos (si los tienes)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('API del Sistema de Inventario funcionando correctamente');
});

// Middleware de logging para depuración
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.path}`);
  console.log('Origen:', req.get('origin'));
  next();
});

// Conectar a MongoDB
console.log('Intentando conectar a MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('Conectado a MongoDB Atlas');
  
  // Inicializar las rutas
  app.use('/api/products', productRoutes);
  
  // Configuración para desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  }
})
.catch(err => {
  console.error('Error conectando a MongoDB Atlas:', err);
});

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Ocurrió un error en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Importante para Vercel: exportar la aplicación
module.exports = app;