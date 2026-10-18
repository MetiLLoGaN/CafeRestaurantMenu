/* Resolve a stored image value to a usable <img src>.
   - absolute http(s)://, protocol-relative //, data: and blob: values pass through
   - relative paths (e.g. "/uploads/abc.jpg") are resolved against the API origin
     so locally uploaded images load even when the API runs on another port. */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export default function resolveImageUrl(image) {
  if (!image) return '';
  if (/^(https?:)?\/\//.test(image) || /^(data|blob):/.test(image)) return image;
  return `${API_ORIGIN}${image.startsWith('/') ? '' : '/'}${image}`;
}
