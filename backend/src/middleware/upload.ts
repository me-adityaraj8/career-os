import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

// Resolve and ensure the upload directory exists at startup.
const uploadPath = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  // Store under a random uuid to avoid collisions / path traversal from the
  // original filename; the original name is kept in the DB for display.
  filename: (_req, _file, cb) => cb(null, `${randomUUID()}.pdf`),
});

/** Multer instance: PDF only, 5 MB max, single file field named "file". */
export const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(ApiError.badRequest('Only PDF files are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');

export { uploadPath };
