const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Suprimir la advertencia de strictQuery
mongoose.set('strictQuery', false);

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('API del Sistema de Inventario funcionando correctamente');
});

// Conectar a MongoDB antes de establecer las rutas
console.log('Intentando conectar a MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Aumentar el tiempo de espera para conexiones lentas
  serverSelectionTimeoutMS: 30000,
  // Aumentar el tiempo de espera para el socket
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Conectado a MongoDB Atlas');
  
  // Inicializar las rutas después de la conexión exitosa
  app.use('/api/products', productRoutes);
  
  // Ruta de prueba para verificar la conexión a la base de datos
  app.get('/api/test', async (req, res) => {
    try {
      // Verificar la conexión listando las colecciones
      const collections = await mongoose.connection.db.listCollections().toArray();
      res.json({ 
        status: 'success',
        message: 'Conexión a MongoDB Atlas establecida correctamente',
        collections: collections.map(col => col.name)
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        message: 'Error al listar colecciones',
        error: error.message
      });
    }
  });

  // Iniciar el servidor solo después de conectar a la base de datos
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('Error conectando a MongoDB Atlas:', err);
});