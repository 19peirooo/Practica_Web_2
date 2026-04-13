// En cualquier controlador o middleware
import { sendSlackNotification } from '../utils/handleLogger.js';

export const criticalOperation = async (req, res) => {
  try {
    // Operación crítica...
    await sendSlackNotification('✅ Operación crítica completada');
  } catch (error) {
    await sendSlackNotification(`❌ Error crítico: ${error.message}`);
    throw error;
  }
};