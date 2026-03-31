// src/middleware/sanitize.middleware.js

/**
 * Elimina operadores MongoDB peligrosos de req.body
 * Previene ataques de inyección NoSQL como:
 * { "email": { "$gt": "" }, "password": { "$gt": "" } }
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      for (const key in obj) {
        // Eliminar claves que empiezan con $ (operadores MongoDB)
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
};

/**
 * Limita el tamaño de strings para prevenir DoS
 */
export const limitStringLength = (maxLength = 10000) => (req, res, next) => {
  const truncate = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].length > maxLength) {
        obj[key] = obj[key].substring(0, maxLength);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        truncate(obj[key]);
      }
    }
  };
  
  if (req.body) truncate(req.body);
  next();
};

/**
 * Elimina campos no permitidos del body
 */
export const allowedFields = (...fields) => (req, res, next) => {
  if (req.body) {
    const filtered = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        filtered[field] = req.body[field];
      }
    }
    req.body = filtered;
  }
  next();
};