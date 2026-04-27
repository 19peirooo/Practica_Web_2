import multer from 'multer';
import { extname, join } from 'node:path';

const memoryStorage = multer.memoryStorage();

export const uploadMemory = multer({ storage: memoryStorage });

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

// Middleware de upload
const uploadMiddleware = multer({
  uploadMemory,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,    // 5MB
    files: 5                      // Máximo 5 archivos
  }
});

export default uploadMiddleware;