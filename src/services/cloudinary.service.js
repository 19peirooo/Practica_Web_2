// src/services/cloudinary.service.js
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

class CloudinaryService {
  /**
   * Subir archivo desde buffer (de Multer memoryStorage)
   */
  async uploadBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'uploads',
          resource_type: options.resourceType || 'auto',
          public_id: options.publicId,
          transformation: options.transformation,
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convertir buffer a stream y enviarlo
      const readableStream = Readable.from(buffer);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Subir imagen con transformaciones automáticas
   */
  async uploadImage(buffer, options = {}) {
    return this.uploadBuffer(buffer, {
      folder: 'images',
      resourceType: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    });
  }

  /**
   * Subir avatar con recorte circular
   */
  async uploadAvatar(buffer, userId) {
    return this.uploadBuffer(buffer, {
      folder: 'avatars',
      public_id: `user_${userId}`,
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { radius: 'max' },
        { quality: 'auto' }
      ]
    });
  }

  /**
   * Subir imagen de producto con múltiples tamaños
   */
  async uploadProductImage(buffer, productId, index = 0) {
    return this.uploadBuffer(buffer, {
      folder: 'products',
      public_id: `product_${productId}_${index}`,
      eager: [
        { width: 150, height: 150, crop: 'fill' },   // Thumbnail
        { width: 400, height: 400, crop: 'fill' },   // Card
        { width: 800, height: 800, crop: 'limit' }   // Detail
      ],
      eager_async: true
    });
  }

  /**
   * Eliminar archivo por public_id
   */
  async delete(publicId, resourceType = 'image') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
  }

  /**
   * Eliminar múltiples archivos
   */
  async deleteMany(publicIds, resourceType = 'image') {
    return cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType
    });
  }

  /**
   * Obtener URL optimizada
   */
  getOptimizedUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...options
    });
  }

  /**
   * Generar URL con transformaciones
   */
  getTransformedUrl(publicId, transformations) {
    return cloudinary.url(publicId, {
      transformation: transformations
    });
  }
}

export default new CloudinaryService();