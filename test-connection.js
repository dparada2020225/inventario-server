const mongoose = require('mongoose');
require('dotenv').config();

console.log('Intentando conectar a MongoDB Atlas...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Conexión exitosa a MongoDB Atlas');
  console.log('Base de datos:', mongoose.connection.db.databaseName);
  
  // Cerrar la conexión después de la prueba
  mongoose.connection.close();
  console.log('Conexión cerrada');
})
.catch(err => {
  console.error('Error conectando a MongoDB Atlas:', err);
});