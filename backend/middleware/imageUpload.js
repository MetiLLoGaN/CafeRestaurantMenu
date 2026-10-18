const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/* Ensure the uploads directory exists (fresh clones won't have it) */
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* Allowed image types. The stored extension is derived from the VALIDATED
   mimetype — the client-supplied filename is never used, so path traversal
   through the filename is impossible. */
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype];
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
    const err = new Error('Unsupported file type. Use JPEG, PNG, WebP or GIF.');
    err.status = 400;
    cb(err);
  },
});

/* Map multer errors (oversized file, unsupported type, …) to a clean 400 JSON
   response instead of the default HTML error page. */
const handleUploadError = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError || err.status === 400) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

/* Best-effort removal of a locally stored upload. Only touches files inside
   UPLOAD_DIR; path.basename() strips any directory components, and external
   URLs (https://…, Cloudinary links) are ignored. */
const removeLocalImage = (imageName) => {
  if (!imageName || !imageName.startsWith('/uploads/')) return;
  const fileName = path.basename(imageName);
  if (!fileName) return;
  fs.unlink(path.join(UPLOAD_DIR, fileName), () => {});
};

module.exports = { upload, handleUploadError, removeLocalImage, UPLOAD_DIR, ALLOWED_TYPES, MAX_FILE_SIZE };
