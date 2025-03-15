// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );
};

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    // Verificar si el usuario que está creando es admin (solo admins pueden crear otros admins)
    if (req.body.role === 'admin') {
      // Si no hay token o el usuario no es admin, rechazar
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No tienes permiso para crear administradores' });
      }
    }

    const { username, password, role } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }
    
    // Crear nuevo usuario
    const newUser = new User({
      username,
      password,
      role: role || 'user' // Por defecto es 'user'
    });
    
    await newUser.save();
    
    // No enviar el password en la respuesta
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role
    };
    
    res.status(201).json({ message: 'Usuario creado exitosamente', user: userResponse });
    
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generar token
    const token = generateToken(user);
    
    // Respuesta
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error: error.message });
  }
};

// Obtener todos los usuarios (solo para admin)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener información del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};