const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');

// Configuración
dotenv.config();
const app = express();

// Imprimir la URL de conexión (solo la primera parte para seguridad)
const mongoUriStart = process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'no definido';
console.log('MONGODB_URI:', mongoUriStart);

// Definir la URL de conexión con un fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reconstructoraantigua:bpTyzgiXREOiKoEC@cluster0.t6q15.mongodb.net/inventario?retryWrites=true&w=majority';
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

// Conectar a MongoDB
console.log('Intentando conectar a MongoDB Atlas...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('Conectado a MongoDB Atlas');
  
  // Inicializar las rutas
  app.use('/api/products', productRoutes);
  
  // Iniciar el servidor
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('Error conectando a MongoDB Atlas:', err);
});