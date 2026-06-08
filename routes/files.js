const express = require('express');
const multer = require('multer');
const db = require('../database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB máximo
});

// Subir archivo (protegido)
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha enviado ningún archivo' });
  }

  const { originalname, mimetype, buffer } = req.file;
  const base64Data = buffer.toString('base64'); // "encriptado" en base64

  const userId = req.userId;

  db.run(
    'INSERT INTO files (user_id, filename, mimetype, data) VALUES (?, ?, ?, ?)',
    [userId, originalname, mimetype, base64Data],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al guardar el archivo' });
      }
      res.status(201).json({
        message: 'Archivo subido correctamente',
        fileId: this.lastID,
        filename: originalname
      });
    }
  );
});

// Listar archivos del usuario autenticado
router.get('/files', authMiddleware, (req, res) => {
  const userId = req.userId;
  db.all(
    'SELECT id, filename, mimetype, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener archivos' });
      res.json(rows);
    }
  );
});

// Descargar archivo por ID
router.get('/file/:id', authMiddleware, (req, res) => {
  const fileId = req.params.id;
  const userId = req.userId;

  db.get(
    'SELECT * FROM files WHERE id = ? AND user_id = ?',
    [fileId, userId],
    (err, file) => {
      if (err) return res.status(500).json({ error: 'Error en la base de datos' });
      if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });

      const buffer = Buffer.from(file.data, 'base64');
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(buffer);
    }
  );
});

module.exports = router;
