import multer from 'multer';
import path from 'path';
import log from '../utils/logger.js';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, 'doctor_' + Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      log(`UPLOAD ERROR - Rejected file extension: ${ext}`);
      return cb(new Error('COMMON.ERROR.ONLY_IMAGES'), false);
    }
    cb(null, true);
  }
});
