import jwt from 'jsonwebtoken';

export const authMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token
    || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Token no proporcionado'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
};