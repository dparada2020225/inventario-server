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

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://inventario-server-7k7jueem8-paradadeniljosegmailcoms-projects.vercel.app/api'], // Actualiza con tu dominio de frontend
  credentials: true
}));

app.use(express.json());

// Servir archivos estáticos (si los tienes)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('API del Sistema de Inventario funcionando correctamente');
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
  
  // Si estás utilizando Vercel, no es necesario que el servidor escuche en un puerto
  // Este bloque solo se ejecutará en desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  }
})
.catch(err => {
  console.error('Error conectando a MongoDB Atlas:', err);
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

// Importante para Vercel: exportar la aplicación
module.exports = app;