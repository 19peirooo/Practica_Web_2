import { ZodError } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });

    req.body = parsed.body

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(err => ({
        campo: err.path.join('.'),
        mensaje: err.message
      }));
      
      return res.status(400).json({
        error: 'Error de validación',
        detalles: errors
      });
    }
    next(error);
  }
};