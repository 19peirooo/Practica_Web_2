// src/middleware/error.middleware.js
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

const isProduction = process.env.NODE_ENV === 'production'

export const notFound = (req, res, next) => {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || 500).json({
    error: true,
    message: isProduction ? 'Error interno' : err.message,
    ...(isProduction ? {} : { stack: err.stack })

  });
  
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: true,
      message: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details
    });
  }
  
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: true,
      message: `Valor inválido para '${err.path}'`,
      code: 'CAST_ERROR'
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      error: true,
      message: `Ya existe un registro con ese '${field}'`,
      code: 'DUPLICATE_KEY'
    });
  }
  
  if (err.name === 'ZodError') {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      error: true,
      message: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: true,
      message: 'Archivo muy grande',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: true,
      message: 'Demasiados archivos',
      code: 'TOO_MANY_FILES'
    });
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: true,
    message: isProduction ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR',
    ...(!isProduction && { stack: err.stack })
  });
};