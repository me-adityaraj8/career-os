import multer from 'multer';
import { ApiError } from '../utils/ApiError';

/**
 * Multer instance: PDF only, 5 MB max, single file field named "file".
 *
 * Uses memory storage so the bytes can be handed to whichever storage driver
 * is active (local disk or Supabase Storage) rather than being written
 * straight to a filesystem that may not persist. 5 MB is small enough that
 * buffering in memory is cheaper than a temp-file round trip.
 */
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(ApiError.badRequest('Only PDF files are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');
