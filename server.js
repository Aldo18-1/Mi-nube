require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // para aceptar base64 grandes en JSON (no necesario para upload pero sí por si acaso)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api', authRoutes);
app.use('/api', fileRoutes);

// Ruta principal -> redirige a index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
