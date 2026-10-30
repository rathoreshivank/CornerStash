const multer = require('multer');

// List of image MIME types we accept
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Maximum image size in bytes (5 MB)
const MAX_SIZE = 5 * 1024 * 1024;

// Multer stores the file in memory as a Buffer (no temp files on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  // Accept only JPEG, PNG, and WebP images
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

module.exports = upload;
