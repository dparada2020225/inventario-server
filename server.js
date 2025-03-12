const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const path = require('path');
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
  
  // Configuración de GridFS
  let gfs;
  mongoose.connection.once('open', () => {
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('GridFS inicializado correctamente');
  });

  // Configuración del almacenamiento para GridFS
  const storage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      return {
        filename: `${Date.now()}-${file.originalname}`,
        bucketName: 'uploads',
        metadata: {
          mimetype: file.mimetype
        }
      };
    }
  });

  const upload = multer({ 
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB límite
    },
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|gif/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("Solo se permiten imágenes (jpg, jpeg, png, gif)"));
    }
  });

  // Ruta para subir imágenes
  app.post('/upload', upload.single('image'), async (req, res) => {
    try {
      console.log('Archivo recibido en upload:', req.file);
      
      if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo' });
      }
      
      // Verificar que el archivo se guardó correctamente
      const gfs = Grid(mongoose.connection.db, mongoose.mongo);
      gfs.collection('uploads');
      
      const fileId = req.file.id;
      console.log('Archivo guardado con ID:', fileId);
      
      // Verificar que el archivo existe en GridFS
      const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: fileId });
      
      if (!file) {
        console.error('El archivo subido no se encuentra en GridFS');
        return res.status(500).json({ message: 'Error al guardar el archivo' });
      }
      
      console.log('Archivo confirmado en GridFS:', file._id.toString());
      
      // Verificar que existen chunks
      const chunkCount = await mongoose.connection.db.collection('uploads.chunks').countDocuments({ files_id: fileId });
      console.log('Chunks almacenados para el archivo:', chunkCount);
      
      res.status(201).json({ 
        imageId: file._id.toString(),
        filename: file.filename,
        contentType: file.contentType
      });
    } catch (error) {
      console.error('Error en la subida de archivo:', error);
      res.status(500).json({ message: 'Error interno al subir archivo', error: error.toString() });
    }
  });

  // Ruta para obtener imágenes
// Modifica solo esta ruta en tu servidor.js
app.get('/images/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Solicitando imagen ID:', id);
    
    // Reinicializar gfs para cada solicitud
    const gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      console.error('ID de imagen inválido:', err);
      return res.status(400).send('ID de imagen inválido');
    }
    
    // Buscar el archivo directamente en la colección
    const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: objectId });
    
    if (!file) {
      console.error('Archivo no encontrado para ID:', id);
      return res.status(404).send('Imagen no encontrada');
    }
    
    console.log('Archivo encontrado:', file.filename);
    
    // Establecer el tipo de contenido
    res.set('Content-Type', file.contentType || 'image/png');
    
    // Obtener los chunks manualmente
    const chunks = await mongoose.connection.db.collection('uploads.chunks')
      .find({ files_id: objectId })
      .sort({ n: 1 })
      .toArray();
    
    if (!chunks || chunks.length === 0) {
      console.error('No se encontraron chunks para el archivo');
      return res.status(404).send('No se encontraron datos para la imagen');
    }
    
    // Concatenar los chunks en un solo buffer
    const fileData = chunks.reduce((acc, chunk) => {
      // Si acc es buffer, concatenar con el buffer del chunk
      return Buffer.concat([acc, chunk.data.buffer]);
    }, Buffer.alloc(0));
    
    // Enviar el buffer como respuesta
    res.send(fileData);
    
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    res.status(500).send('Error del servidor al recuperar la imagen');
  }
});

  // Ruta para listar todos los archivos en GridFS (para diagnóstico)
  app.get('/gridfs-files', async (req, res) => {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Colecciones en la base de datos:', collections.map(c => c.name));
      
      if (!collections.some(c => c.name === 'uploads.files')) {
        return res.json({ 
          error: 'La colección uploads.files no existe',
          collections: collections.map(c => c.name)
        });
      }
      
      const files = await mongoose.connection.db.collection('uploads.files').find().toArray();
      
      res.json({
        fileCount: files.length,
        files: files.map(file => ({
          id: file._id.toString(),
          filename: file.filename,
          contentType: file.contentType || file.metadata?.mimetype,
          size: file.length,
          uploadDate: file.uploadDate
        }))
      });
    } catch (error) {
      console.error('Error al listar archivos GridFS:', error);
      res.status(500).json({ error: 'Error al listar archivos', message: error.toString() });
    }
  });
  
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